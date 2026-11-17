import Foundation

/// When Disrupted and Blocked are drawn brighter than white. It makes macOS run the backlight harder, so only with
/// the setting on, on a screen that can (XDR), while plugged in, and only while amber or red is actually showing.
public enum BrightColours {
    public static func isBoosted(isEnabled: Bool, screenHeadroom: Double, hasRaisedLight: Bool, canAffordBoost: Bool) -> Bool {
        isEnabled && screenHeadroom > 1 && hasRaisedLight && canAffordBoost
    }
}
