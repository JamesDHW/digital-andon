import XCTest
@testable import AndonKit

final class NotificationPlannerTests: XCTestCase {
    private let priya = MemberID(rawValue: "priya")

    private func announcement(_ colour: Colour, status: String? = nil, style: AlertStyle, reminder: Int?) -> NotificationIntent {
        .announce(Announcement(memberID: priya, memberName: "Priya", colour: colour, status: status, style: style, reminderMinutes: reminder))
    }

    func testAnnouncesANewRedOnceWithAReminder() {
        let green = Fixtures.team([Fixtures.light("Priya", .green, since: 1)])
        let red = green.applying(.light(Fixtures.light("Priya", .red, since: 2, status: "Blocked")))

        XCTAssertEqual(NotificationPlanner.plan(from: green, to: red, preferences: .standard), [announcement(.red, status: "Blocked", style: .bannerAndSound, reminder: 10)])
        let retitled = red.applying(.light(Fixtures.light("Priya", .red, since: 2, status: "Still blocked")))
        XCTAssertEqual(NotificationPlanner.plan(from: red, to: retitled, preferences: .standard), [])
    }

    func testWithdrawsAsSoonAsTheyLeaveRed() {
        let red = Fixtures.team([Fixtures.light("Priya", .red, since: 2)])
        let amber = red.applying(.light(Fixtures.light("Priya", .amber, since: 3)))
        let off = red.applying(.light(Fixtures.light("Priya", .off, since: 3)))

        XCTAssertEqual(NotificationPlanner.plan(from: red, to: amber, preferences: .standard), [.withdraw(priya)])
        XCTAssertEqual(NotificationPlanner.plan(from: red, to: off, preferences: .standard), [.withdraw(priya)])
    }

    func testStaysQuietForAmberAndGreenByDefaultButAnnouncesThemWhenEnabled() {
        let green = Fixtures.team([Fixtures.light("Priya", .green, since: 1)])
        let amber = green.applying(.light(Fixtures.light("Priya", .amber, since: 2)))
        XCTAssertEqual(NotificationPlanner.plan(from: green, to: amber, preferences: .standard), [])

        var chatty = NotificationPreferences.standard
        chatty.amber = .banner
        XCTAssertEqual(NotificationPlanner.plan(from: green, to: amber, preferences: chatty), [announcement(.amber, style: .banner, reminder: nil)])
    }

    func testNeverAnnouncesSwitchingOnOrOff() {
        var everything = NotificationPreferences.standard
        everything.green = .banner
        let off = Fixtures.team([Fixtures.light("Priya", .off, since: 1)])
        let green = off.applying(.light(Fixtures.light("Priya", .green, since: 2)))
        XCTAssertEqual(NotificationPlanner.plan(from: off, to: green, preferences: everything), [])
        XCTAssertEqual(NotificationPlanner.plan(from: green, to: off, preferences: everything), [])
    }

    func testColoursOnlySilencesEverythingButStillWithdraws() {
        var quiet = NotificationPreferences.standard
        quiet.isColoursOnly = true
        let green = Fixtures.team([Fixtures.light("Priya", .green, since: 1)])
        let red = green.applying(.light(Fixtures.light("Priya", .red, since: 2)))
        let amber = red.applying(.light(Fixtures.light("Priya", .amber, since: 3)))

        XCTAssertEqual(NotificationPlanner.plan(from: green, to: red, preferences: quiet), [])
        XCTAssertEqual(NotificationPlanner.plan(from: red, to: amber, preferences: quiet), [.withdraw(priya)])
    }

    func testOnFirstConnectAnnouncesOnlyReds() {
        let state = Fixtures.team([Fixtures.light("Priya", .red, since: 2), Fixtures.light("Tom", .amber, since: 2)])
        XCTAssertEqual(NotificationPlanner.plan(from: nil, to: state, preferences: .standard), [announcement(.red, style: .bannerAndSound, reminder: 10)])
    }

    func testIgnoresPeopleYouDontFollow() {
        let green = Fixtures.team([Fixtures.light("Priya", .green, since: 1)])
        let unfollowed = green.applying(.follows([]))
        let red = unfollowed.applying(.light(Fixtures.light("Priya", .red, since: 2)))
        XCTAssertEqual(NotificationPlanner.plan(from: unfollowed, to: red, preferences: .standard), [])
    }
}
