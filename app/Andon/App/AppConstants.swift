import Foundation

enum AppConstants {
    static let keychainService = "Andon"
    static let urlScheme = "andon"
    static let googleSignInPath = "auth/google/start"
    static let keychainAccount = "session"
    static let preferencesDefaultsKey = "andon.preferences"
    static let defaultServerInfoKey = "AndonDefaultServer"
    static let appcastInfoKey = "SUFeedURL"
    static let sparklePublicKeyInfoKey = "SUPublicEDKey"
    static let developmentServerVariable = "ANDON_API_URL"
    static let developmentTokenVariable = "ANDON_DEV_TOKEN"
    static let popoverWidth: CGFloat = 360
    static let settingsMaxHeight: CGFloat = 460
    static let joinPickerMaxHeight: CGFloat = 380
    static let followingMaxHeight: CGFloat = 420
    static let popoverReopenGuardSeconds: TimeInterval = 0.3
    static let deviceNameMaxLength = 80
    static let elapsedTimeRefreshSeconds: TimeInterval = 30
    static let socketPingSeconds: TimeInterval = 25
    static let socketSilenceLimitSeconds: TimeInterval = 70
    static let statusItemPadding: CGFloat = 8
    /// Changes to your light show on your screen at once and reach the team after this long without another change.
    static let lightSendDelaySeconds: TimeInterval = 3
    /// How late macOS may fire the one-off timer that starts a red breathing at ten minutes.
    static let breathingTimerToleranceSeconds: TimeInterval = 1
    /// Lets macOS fire the ping together with other work instead of waking just for it.
    static let timerToleranceSeconds: TimeInterval = 5
    static let pulsePeriodSeconds: TimeInterval = 2
    /// A helper's face is this much of the person's, and this much of it shows past the face in front.
    static let helperScale: CGFloat = 0.78
    static let helperOverlap: CGFloat = 0.5
    static let socketPingText = "ping"
    static let socketPongText = "pong"
}
