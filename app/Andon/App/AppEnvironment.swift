import AndonKit
import Foundation

/// Values that come from outside the code: the bundle's Info.plist and, for local development, environment variables.
struct AppEnvironment {
    let defaultServer: URL?
    let developmentSession: AccountSession?
    let hasUpdateFeed: Bool

    static let current = AppEnvironment(bundle: .main, processInfo: .processInfo)

    init(bundle: Bundle, processInfo: ProcessInfo) {
        defaultServer = Self.nonEmptyURL(bundle.object(forInfoDictionaryKey: AppConstants.defaultServerInfoKey) as? String)
        let hasFeedURL = Self.nonEmptyURL(bundle.object(forInfoDictionaryKey: AppConstants.appcastInfoKey) as? String) != nil
        let publicKey = (bundle.object(forInfoDictionaryKey: AppConstants.sparklePublicKeyInfoKey) as? String ?? "").trimmingCharacters(in: .whitespaces)
        hasUpdateFeed = hasFeedURL && !publicKey.isEmpty
        developmentSession = Self.developmentSession(from: processInfo.environment)
    }

    /// Set ANDON_API_URL and ANDON_DEV_TOKEN in the Xcode scheme to skip onboarding against a local backend.
    private static func developmentSession(from variables: [String: String]) -> AccountSession? {
        guard let server = nonEmptyURL(variables[AppConstants.developmentServerVariable]) else { return nil }
        guard let token = variables[AppConstants.developmentTokenVariable], !token.isEmpty else { return nil }
        return AccountSession(server: server, deviceToken: token)
    }

    private static func nonEmptyURL(_ text: String?) -> URL? {
        guard let text, !text.trimmingCharacters(in: .whitespaces).isEmpty else { return nil }
        return URL(string: text)
    }
}
