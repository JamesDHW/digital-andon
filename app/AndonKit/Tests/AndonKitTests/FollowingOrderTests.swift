import XCTest
@testable import AndonKit

final class FollowingOrderTests: XCTestCase {
    private let lead = Fixtures.member("Lead")
    private let names = ["Zoe", "Aisha", "Tom", "Émile", "Priya"]

    /// You follow Tom and Zoe.
    private func team(following followed: [String], extra: [String] = []) -> TeamState {
        let members = [lead] + (names + extra).map { Fixtures.member($0) }
        return TeamState(
            you: lead.id,
            members: Dictionary(uniqueKeysWithValues: members.map { ($0.id, $0) }),
            lights: [:],
            follows: followed.map { MemberID(rawValue: $0.lowercased()) },
            online: []
        )
    }

    private func names(_ order: [MemberID], in state: TeamState) -> [String] {
        order.compactMap { state.members[$0]?.name }
    }

    func testPutsPeopleYouFollowFirstThenEveryoneElseEachAlphabeticalLeavingYouOut() {
        let state = team(following: ["Zoe", "Tom"])
        XCTAssertEqual(names(FollowingOrder.initial(in: state), in: state), ["Tom", "Zoe", "Aisha", "Émile", "Priya"])
    }

    func testKeepsSomeoneYouJustUnfollowedWhereTheyWereAndAddsNewcomersAtTheEnd() {
        let opened = FollowingOrder.initial(in: team(following: ["Zoe", "Tom"]))
        let afterUnfollowingTom = team(following: ["Zoe"], extra: ["Ben"])
        XCTAssertEqual(names(FollowingOrder.keeping(opened, in: afterUnfollowingTom), in: afterUnfollowingTom), ["Tom", "Zoe", "Aisha", "Émile", "Priya", "Ben"])
    }

    func testFiltersOnTypingIgnoringCaseAndAccents() {
        let state = team(following: ["Zoe", "Tom"])
        let order = FollowingOrder.initial(in: state)
        XCTAssertEqual(names(FollowingOrder.matching(order, search: "emi", in: state), in: state), ["Émile"])
        XCTAssertEqual(names(FollowingOrder.matching(order, search: "  O ", in: state), in: state), ["Tom", "Zoe"])
        XCTAssertEqual(FollowingOrder.matching(order, search: " ", in: state), order)
    }
}
