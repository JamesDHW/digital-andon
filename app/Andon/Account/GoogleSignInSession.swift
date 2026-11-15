import AndonKit
import AppKit
import AuthenticationServices

/// Signs in with Google in the system's web sign-in sheet. The server talks to Google; this only waits for its
/// andon://signed-in redirect, which carries the new device token or an error message.
@MainActor
final class GoogleSignInSession: NSObject {
    /// Held so the sheet stays open until it finishes.
    private var activeSession: ASWebAuthenticationSession?

    func signIn(server: URL, deviceName: String) async -> Result<String, AndonError> {
        guard let startURL = Self.startURL(server: server, deviceName: deviceName) else {
            return .failure(AndonError(.invalidInput, "Enter your team's Digital Andon address, e.g. https://andon.yourteam.workers.dev"))
        }
        let callback = await withCheckedContinuation { (continuation: CheckedContinuation<Result<URL, AndonError>, Never>) in
            let session = ASWebAuthenticationSession(url: startURL, callbackURLScheme: AppConstants.urlScheme) { callbackURL, error in
                continuation.resume(returning: Self.callbackResult(callbackURL: callbackURL, error: error))
            }
            session.presentationContextProvider = self
            // Shares Safari's cookies, so someone already signed in to Google only has to pick their account.
            session.prefersEphemeralWebBrowserSession = false
            activeSession = session
            if !session.start() {
                continuation.resume(returning: .failure(AndonError(.unexpected, "Couldn't open the Google sign-in window.")))
            }
        }
        activeSession = nil
        return callback.flatMap(Self.deviceToken(from:))
    }

    private nonisolated static func startURL(server: URL, deviceName: String) -> URL? {
        guard server.host != nil else { return nil }
        var components = URLComponents(url: server.appending(path: AppConstants.googleSignInPath), resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "client", value: "app"), URLQueryItem(name: "device", value: deviceName)]
        return components?.url
    }

    private nonisolated static func callbackResult(callbackURL: URL?, error: Error?) -> Result<URL, AndonError> {
        if let callbackURL {
            return .success(callbackURL)
        }
        let isCancelled = (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin
        if isCancelled {
            return .failure(AndonError(.invalidInput, "Sign-in was cancelled."))
        }
        return .failure(AndonError(.network, error?.localizedDescription ?? "Google sign-in didn't finish."))
    }

    private nonisolated static func deviceToken(from callbackURL: URL) -> Result<String, AndonError> {
        let items = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?.queryItems ?? []
        let value = { (name: String) in items.first { $0.name == name }?.value }
        if let token = value("token"), !token.isEmpty {
            return .success(token)
        }
        return .failure(AndonError(.unauthorised, value("error") ?? "Google sign-in didn't finish."))
    }
}

extension GoogleSignInSession: ASWebAuthenticationPresentationContextProviding {
    /// The onboarding window, so the sheet attaches to it.
    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            NSApp.keyWindow ?? NSApp.windows.first { $0.isVisible } ?? ASPresentationAnchor()
        }
    }
}
