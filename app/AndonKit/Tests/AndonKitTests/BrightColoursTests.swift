import XCTest
@testable import AndonKit

final class BrightColoursTests: XCTestCase {
    func testBoostsOnlyWithTheSettingOnAnXDRScreenWhilePluggedInWithAmberOrRedShowing() {
        XCTAssertTrue(BrightColours.isBoosted(isEnabled: true, screenHeadroom: 4, hasRaisedLight: true, canAffordBoost: true))
        XCTAssertFalse(BrightColours.isBoosted(isEnabled: false, screenHeadroom: 4, hasRaisedLight: true, canAffordBoost: true))
        XCTAssertFalse(BrightColours.isBoosted(isEnabled: true, screenHeadroom: 1, hasRaisedLight: true, canAffordBoost: true))
        XCTAssertFalse(BrightColours.isBoosted(isEnabled: true, screenHeadroom: 4, hasRaisedLight: false, canAffordBoost: true))
        XCTAssertFalse(BrightColours.isBoosted(isEnabled: true, screenHeadroom: 4, hasRaisedLight: true, canAffordBoost: false))
    }

    func testBrightColoursAreOnByDefaultIncludingForPreferencesSavedBeforeTheSettingExisted() throws {
        XCTAssertTrue(Preferences.standard.isBrightColours)
        let older = try JSONDecoder().decode(Preferences.self, from: Data(#"{"notifications":{"red":"banner","amber":"off","green":"off","reminderMinutes":5,"isColoursOnly":false}}"#.utf8))
        XCTAssertTrue(older.isBrightColours)
        XCTAssertEqual(older.notifications.red, .banner)
    }

    func testRemembersBrightColoursBeingTurnedOff() throws {
        let off = Preferences(notifications: .standard, isBrightColours: false)
        let decoded = try JSONDecoder().decode(Preferences.self, from: JSONEncoder().encode(off))
        XCTAssertEqual(decoded, off)
    }
}
