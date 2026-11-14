import XCTest
@testable import AndonKit

final class MenuBarModelTests: XCTestCase {
    private let lead = MemberID(rawValue: "lead")
    private let now = Date(timeIntervalSince1970: 10_000)

    private func millisecondsAgo(minutes: Double) -> Double {
        (now.timeIntervalSince1970 - minutes * 60) * 1000
    }

    func testShowsYourLightThenEveryoneWorkingRedFirstWithNoLimit() {
        let names = (1...9).map { "Person\($0)" }
        let state = Fixtures.team(names.map { Fixtures.light($0, .green, since: 1) } + [Fixtures.light("Stuck", .red, since: millisecondsAgo(minutes: 2))])
        let model = MenuBarModel.make(state: state, connection: .connected, now: now)

        XCTAssertEqual(model.ownLight, OwnLightIndicator(colour: .green, isPending: false, isBreathing: false))
        XCTAssertEqual(model.people.count, 10)
        XCTAssertEqual(model.people.first?.member.name, "Stuck")
        XCTAssertFalse(model.isBreathing)
    }

    func testHidesYourOwnLightWhenYouAreOffButStillShowsTheTeam() {
        let state = Fixtures.team([Fixtures.light("Priya", .amber, since: 1)], leadColour: .off)
        let model = MenuBarModel.make(state: state, connection: .connected, now: now)
        XCTAssertNil(model.ownLight)
        XCTAssertEqual(model.people.map(\.colour), [.amber])
    }

    func testDropsPeopleWhoAreOffAndDisconnectedGreensButKeepsDisconnectedReds() {
        let state = Fixtures.team([Fixtures.light("Away", .off, since: 1), Fixtures.light("Asleep", .green, since: 1), Fixtures.light("Stuck", .red, since: 1)])
        let disconnected = TeamState(you: state.you, members: state.members, lights: state.lights, follows: state.follows, online: [state.you])
        let model = MenuBarModel.make(state: disconnected, connection: .connected, now: now)
        XCTAssertEqual(model.people.map(\.member.name), ["Stuck"])
        XCTAssertEqual(model.people.first?.isStale, true)
    }

    func testBreathesARedAfterTenMinutes() {
        let state = Fixtures.team([Fixtures.light("Stuck", .red, since: millisecondsAgo(minutes: 11))])
        let model = MenuBarModel.make(state: state, connection: .connected, now: now)
        XCTAssertEqual(model.people.first?.isBreathing, true)
        XCTAssertTrue(model.isBreathing)
    }

    func testShowsAPendingColourAsNotYetSentAndNotBreathing() {
        let state = Fixtures.team([], leadColour: .red)
        let model = MenuBarModel.make(state: state, connection: .connected, pendingOwnColour: .green, now: now.addingTimeInterval(3_600))
        XCTAssertEqual(model.ownLight, OwnLightIndicator(colour: .green, isPending: true, isBreathing: false))
    }

    func testShowsNothingBeforeTheFirstHelloAndDimsWhileDisconnected() {
        XCTAssertTrue(MenuBarModel.make(state: nil, connection: .signedOut, now: now).hasNothingToShow)
        XCTAssertTrue(MenuBarModel.make(state: Fixtures.team([]), connection: .disconnected, now: now).isDimmed)
    }
}

final class DropdownModelTests: XCTestCase {
    func testGroupsPeopleByColourWithOffAndDisconnectedTogether() {
        let state = Fixtures.team([
            Fixtures.light("Stuck", .red, since: 1),
            Fixtures.light("Unsure", .amber, since: 1),
            Fixtures.light("Fine", .green, since: 1),
            Fixtures.light("Away", .off, since: 1),
        ])
        let model = DropdownModel.make(state: state)
        XCTAssertEqual(model.red.map(\.rankedMember.member.name), ["Stuck"])
        XCTAssertEqual(model.amber.map(\.rankedMember.member.name), ["Unsure"])
        XCTAssertEqual(model.green.map(\.rankedMember.member.name), ["Fine"])
        XCTAssertEqual(model.off.map(\.rankedMember.member.name), ["Away"])
    }
}
