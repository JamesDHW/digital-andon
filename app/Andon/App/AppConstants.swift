import Foundation

enum AppConstants {
    static let keychainService = "Andon"
    static let keychainAccount = "session"
    static let preferencesDefaultsKey = "andon.preferences"
    static let defaultServerInfoKey = "AndonDefaultServer"
    static let appcastInfoKey = "SUFeedURL"
    static let sparklePublicKeyInfoKey = "SUPublicEDKey"
    static let developmentServerVariable = "ANDON_API_URL"
    static let developmentTokenVariable = "ANDON_DEV_TOKEN"
    static let popoverWidth: CGFloat = 360
    static let popoverReopenGuardSeconds: TimeInterval = 0.3
    static let deviceNameMaxLength = 80
    static let elapsedTimeRefreshSeconds: TimeInterval = 30
    static let socketPingSeconds: TimeInterval = 25
    static let socketSilenceLimitSeconds: TimeInterval = 70
    static let statusItemPadding: CGFloat = 8
    /// How long the arrow shortcuts wait after the last press before sending the new level.
    static let cycleSendDelaySeconds: TimeInterval = 10
    /// How often the menu bar re-checks the time, so a red starts breathing at ten minutes.
    static let menuBarClockSeconds: TimeInterval = 15
    static let pulseFrameSeconds: TimeInterval = 0.08
    static let pulsePeriodSeconds: TimeInterval = 2
    static let avatarMaxDimension: CGFloat = 256
    static let socketPingText = "ping"
    static let socketPongText = "pong"
}
