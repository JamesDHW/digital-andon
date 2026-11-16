import XCTest
@testable import AndonKit

final class JoiningTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 10_000)
    private let priya = MemberID(rawValue: "priya")
    private let tom = MemberID(rawValue: "tom")

    private func millisecondsAgo(minutes: Double) -> Double {
        (now.timeIntervalSince1970 - minutes * 60) * 1000
    }

    /// Priya has been blocked for 20 minutes; Tom has joined her. Anyone else is added alongside.
    private func priyaJoinedByTom(and others: [Light] = []) -> TeamState {
        Fixtures.team([
            Fixtures.light("Priya", .red, since: millisecondsAgo(minutes: 20)),
            Fixtures.light("Tom", .amber, since: millisecondsAgo(minutes: 5), status: "with Priya", helping: "Priya"),
        ] + others)
    }

    func testDecodesWhoSomeoneIsWithAndTreatsAMissingFieldAsNobody() throws {
        let joined = try ServerMessage.decode(#"{"type":"light","light":{"memberId":"tom","colour":"amber","status":"with Priya","since":1,"helping":"priya"}}"#).get()
        XCTAssertEqual(joined, .light(Light(memberId: tom, colour: .amber, status: "with Priya", since: 1, helping: priya)))
        let older = try ServerMessage.decode(#"{"type":"light","light":{"memberId":"tom","colour":"amber","status":null,"since":1}}"#).get()
        XCTAssertEqual(older, .light(Light(memberId: tom, colour: .amber, status: nil, since: 1)))
    }

    func testEncodesJoinAndLeave() throws {
        let join = try XCTUnwrap(ClientMessage.join(priya).encoded().get().data(using: .utf8))
        XCTAssertEqual(try JSONSerialization.jsonObject(with: join) as? [String: String], ["type": "join", "memberId": "priya"])
        XCTAssertEqual(try ClientMessage.leave.encoded().get(), #"{"type":"leave"}"#)
    }

    func testAJoinedRedStopsBreathingAndRanksBehindARedNobodyHasReached() {
        let state = priyaJoinedByTom(and: [Fixtures.light("Aisha", .red, since: millisecondsAgo(minutes: 2))])
        XCTAssertEqual(state.helpers(of: priya).map(\.id), [tom])
        XCTAssertFalse(state.isBreathing(priya, at: now))
        XCTAssertEqual(Ranking.ranked([priya, MemberID(rawValue: "aisha")], in: state).map(\.member.name), ["Aisha", "Priya"])
    }

    func testDrawsAHelperBehindThePersonTheyJoinedInsteadOfOnTheirOwn() {
        let model = MenuBarModel.make(state: priyaJoinedByTom(), connection: .connected, now: now)
        XCTAssertEqual(model.people.map(\.member.name), ["Priya"])
        XCTAssertEqual(model.people.first?.helpers.map(\.member.name), ["Tom"])
        XCTAssertEqual(model.people.first?.isBreathing, false)
        XCTAssertNil(model.breathesNextAt)
    }

    func testGoingClearOrOffLocallyEndsTheJoinButAStatusChangeKeepsIt() {
        let light = Fixtures.light("Tom", .amber, since: 1, status: "with Priya", helping: "Priya")
        XCTAssertNil(light.pulled(.green, atMilliseconds: 2).helping)
        XCTAssertNil(light.pulled(.off, atMilliseconds: 2).helping)
        XCTAssertEqual(light.pulled(.red, atMilliseconds: 2).helping, priya)
        XCTAssertEqual(light.withStatus("Pairing").helping, priya)
    }

    func testOffersEveryoneDisruptedOrBlockedWhoIsntAlreadyWithSomeone() {
        let state = priyaJoinedByTom(and: [Fixtures.light("Aisha", .amber, since: millisecondsAgo(minutes: 1))])
        XCTAssertEqual(Ranking.joinable(in: state).map(\.member.name), ["Priya", "Aisha"])
    }

    func testOffersClearPeopleLastSoTimeWithAnyoneCanBeLogged() {
        let state = priyaJoinedByTom(and: [Fixtures.light("Aisha", .green, since: 1)])
        XCTAssertEqual(Ranking.joinable(in: state).map(\.member.name), ["Priya", "Aisha"])
    }

    func testWithdrawsTheBannerOnceSomeoneJoinsARed() {
        let alone = Fixtures.team([
            Fixtures.light("Priya", .red, since: millisecondsAgo(minutes: 20)),
            Fixtures.light("Tom", .green, since: 1),
        ])
        XCTAssertEqual(NotificationPlanner.plan(from: alone, to: priyaJoinedByTom(), preferences: .standard), [.withdraw(priya)])
    }
}
