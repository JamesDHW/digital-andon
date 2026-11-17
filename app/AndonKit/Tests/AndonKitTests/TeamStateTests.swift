import XCTest
@testable import AndonKit

final class TeamStateTests: XCTestCase {
    func testAppliesLightsPresenceFollowsAndRemovals() throws {
        let state = Fixtures.helloState()
        let green = state.applying(.light(Light(memberId: Fixtures.priya, colour: .green, status: nil, since: 5)))
        XCTAssertEqual(green.light(for: Fixtures.priya)?.colour, .green)

        let online = green.applying(.presence(memberID: Fixtures.priya, isOnline: true))
        XCTAssertTrue(online.online.contains(Fixtures.priya))

        let unfollowed = online.applying(.follows([Fixtures.aisha]))
        XCTAssertFalse(unfollowed.isFollowing(Fixtures.priya))

        let removed = unfollowed.applying(.memberRemoved(Fixtures.aisha))
        XCTAssertNil(removed.members[Fixtures.aisha])
        XCTAssertEqual(removed.follows, [])
    }

    func testDefaultsAMemberWithoutAStoredLightToGreenSinceTheyJoined() {
        let newcomer = Fixtures.member("Newcomer", joinedAt: 42)
        let state = Fixtures.emptyState.applying(.member(newcomer))
        XCTAssertEqual(state.light(for: newcomer.id), Light(memberId: newcomer.id, colour: .green, status: nil, since: 42))
    }

    func testIgnoresErrorsAndUnknownMessages() {
        let state = Fixtures.helloState()
        XCTAssertEqual(state.applying(.error(code: "forbidden", message: "No")), state)
        XCTAssertEqual(state.applying(.unknown(type: "future")), state)
    }
}

final class RankingTests: XCTestCase {
    func testOrdersRedThenAmberThenGreenThenOff() {
        let state = Fixtures.team([
            Fixtures.light("Away", .off, since: 1),
            Fixtures.light("Green", .green, since: 1),
            Fixtures.light("Amber", .amber, since: 1),
            Fixtures.light("Red", .red, since: 5),
        ])
        XCTAssertEqual(Ranking.followed(in: state).map(\.member.name), ["Red", "Amber", "Green", "Away"])
    }

    func testPutsTheLongestRunningRedFirstAndTheMostRecentlyChangedGreenFirst() {
        let state = Fixtures.team([
            Fixtures.light("Newer", .red, since: 20),
            Fixtures.light("Older", .red, since: 10),
            Fixtures.light("Calm", .green, since: 10),
            Fixtures.light("Fresh", .green, since: 30),
        ])
        XCTAssertEqual(Ranking.followed(in: state).map(\.member.name), ["Older", "Newer", "Fresh", "Calm"])
    }

    func testNeverRanksYourself() {
        let state = Fixtures.helloState()
        let withSelf = TeamState(you: state.you, members: state.members, lights: state.lights, follows: state.follows + [state.you], online: state.online)
        XCTAssertFalse(Ranking.followed(in: withSelf).contains { $0.id == state.you })
    }
}

final class SupportTests: XCTestCase {
    func testDescribesElapsedTime() {
        let now = Date(timeIntervalSince1970: 100_000)
        XCTAssertEqual(ElapsedTime.describe(sinceMilliseconds: 99_990_000, now: now), "just now")
        XCTAssertEqual(ElapsedTime.describe(sinceMilliseconds: 99_760_000, now: now), "4 min")
        XCTAssertEqual(ElapsedTime.describe(sinceMilliseconds: 92_800_000, now: now), "2 h")
        XCTAssertEqual(ElapsedTime.describe(sinceMilliseconds: 0, now: now), "1 d")
    }

    func testLoadsPreferencesSavedByAnOlderVersion() throws {
        let saved = #"{"menuBar":{"showsOwnLight":false,"hidesWhenAllGreen":true,"palette":"soft"},"notifications":{"red":"banner","amber":"off","green":"off","reminderMinutes":5,"isColoursOnly":false}}"#
        let preferences = try JSONDecoder().decode(Preferences.self, from: Data(saved.utf8))
        XCTAssertEqual(preferences.notifications.red, .banner)
        XCTAssertEqual(preferences.notifications.reminderMinutes, 5)
    }

    func testMakesInitialsFromUpToTwoWords() {
        XCTAssertEqual(Fixtures.member("Priya Shah").initials, "PS")
        XCTAssertEqual(Member(id: MemberID(rawValue: "x"), name: "ana maría lópez", email: "", avatarUrl: nil, role: .member, joinedAt: 0).initials, "AM")
    }
}

final class LightPullTests: XCTestCase {
    private let green = Fixtures.light("Priya", .green, since: 1)

    func testANewColourStartsANewPeriodAndTheSameColourChangesNothing() {
        let red = green.pulled(.red, atMilliseconds: 10)
        XCTAssertEqual(red, Fixtures.light("Priya", .red, since: 10))
        XCTAssertEqual(red.pulled(.red, atMilliseconds: 20), red)
    }

    func testKeepsTheStatusThroughAmberRedAndOffAndClearsItOnGreen() {
        let amber = green.pulled(.amber, atMilliseconds: 10).withStatus("Pairing on the migration")
        let off = amber.pulled(.red, atMilliseconds: 20).pulled(.off, atMilliseconds: 30)
        XCTAssertEqual(off, Fixtures.light("Priya", .off, since: 30, status: "Pairing on the migration"))
        XCTAssertEqual(off.pulled(.green, atMilliseconds: 40), Fixtures.light("Priya", .green, since: 40))
    }

    func testSetsAStatusOnAnyColourAsTheServerStoresIt() {
        XCTAssertEqual(green.withStatus("  Deep\n work  ").status, "Deep work")
        XCTAssertNil(green.withStatus("Busy").withStatus("   ").status)
        XCTAssertEqual(green.withStatus(String(repeating: "x", count: 500)).status?.count, 140)
        XCTAssertEqual(green.withStatus("Busy").since, green.since)
    }

    func testBreathesOnlyWhenRedForTenMinutes() {
        let start = Date(timeIntervalSince1970: 1_000)
        let red = Fixtures.light("Priya", .red, since: 1_000_000)
        XCTAssertFalse(red.isBreathing(at: start.addingTimeInterval(9 * 60)))
        XCTAssertTrue(red.isBreathing(at: start.addingTimeInterval(10 * 60)))
        XCTAssertFalse(Fixtures.light("Priya", .amber, since: 1_000_000).isBreathing(at: start.addingTimeInterval(60 * 60)))
    }
}

final class LightCycleTests: XCTestCase {
    func testStepsUpAndDownAndWrapsAtBothEnds() {
        XCTAssertEqual(LightCycle.next(after: .green, .up), .amber)
        XCTAssertEqual(LightCycle.next(after: .amber, .up), .red)
        XCTAssertEqual(LightCycle.next(after: .red, .up), .green)
        XCTAssertEqual(LightCycle.next(after: .red, .down), .amber)
        XCTAssertEqual(LightCycle.next(after: .amber, .down), .green)
        XCTAssertEqual(LightCycle.next(after: .green, .down), .red)
    }

    func testDownDownFromStopLandsOnClear() {
        XCTAssertEqual(LightCycle.next(after: LightCycle.next(after: .red, .down), .down), .green)
    }

    func testCyclingWhileOffSwitchesYouOnFromClear() {
        XCTAssertEqual(LightCycle.next(after: .off, .up), .amber)
        XCTAssertEqual(LightCycle.next(after: .off, .down), .red)
    }
}
