import AndonKit
import AppKit
import Combine
import SystemConfiguration

/// Who this Mac is signed in as, and every account-level request: Google sign-in, email codes, your name and follows.
@MainActor
final class AccountController: ObservableObject {
    @Published private(set) var session: AccountSession?

    private let sessionStore: KeychainSessionStore
    private let transport: HTTPTransport
    private let isDevelopmentSession: Bool
    private let googleSignIn = GoogleSignInSession()
    let deviceName: String

    init(sessionStore: KeychainSessionStore, transport: HTTPTransport, environment: AppEnvironment) {
        self.sessionStore = sessionStore
        self.transport = transport
        self.isDevelopmentSession = environment.developmentSession != nil
        self.deviceName = Self.currentDeviceName()
        self.session = environment.developmentSession ?? sessionStore.load()
    }

    /// Anyone on one of the team's allowed domains joins this way on their own; their Google photo comes with them.
    func signInWithGoogle(server: URL) async -> Result<Void, AndonError> {
        let deviceToken = await googleSignIn.signIn(server: server, deviceName: deviceName)
        return deviceToken.flatMap { token in signIn(AccountSession(server: server, deviceToken: token)) }
    }

    func requestCode(server: URL, email: String) async -> Result<Void, AndonError> {
        await transport.send(APIRequest.requestCode(server: server, email: email))
    }

    func verifyCode(server: URL, email: String, code: String) async -> Result<Void, AndonError> {
        let request = APIRequest.verifyCode(server: server, email: email, code: code, deviceName: deviceName)
        let signedIn = await transport.send(request, expecting: SignedInDevice.self)
        return signedIn.flatMap { device in signIn(AccountSession(server: server, deviceToken: device.deviceToken)) }
    }

    func signOut() {
        sessionStore.clear()
        session = nil
    }

    func updateProfile(_ change: ProfileChange) async -> Result<Member, AndonError> {
        guard let session else { return .failure(AndonError(.unauthorised, "Sign in first.")) }
        return await transport.send(APIRequest.updateProfile(session, change: change), expecting: Member.self)
    }

    func replaceFollows(_ memberIDs: [MemberID]) async -> Result<Void, AndonError> {
        guard let session else { return .failure(AndonError(.unauthorised, "Sign in first.")) }
        return await transport.send(APIRequest.replaceFollows(session, memberIDs: memberIDs))
    }

    private func signIn(_ newSession: AccountSession) -> Result<Void, AndonError> {
        let saved: Result<Void, AndonError> = isDevelopmentSession ? .success(()) : sessionStore.save(newSession)
        if case .success = saved {
            session = newSession
        }
        return saved
    }
}

private extension AccountController {
    /// The Mac's name from Sharing settings; Host.current() would do DNS lookups on the main thread.
    static func currentDeviceName() -> String {
        let computerName = SCDynamicStoreCopyComputerName(nil, nil) as String? ?? "Mac"
        return String(computerName.prefix(AppConstants.deviceNameMaxLength))
    }
}
