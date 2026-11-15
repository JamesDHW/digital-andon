import AndonKit
import Combine
import Foundation

/// Signing in is one click with a work Google account. An emailed code still works as a fallback.
@MainActor
final class OnboardingModel: ObservableObject {
    enum Step: Equatable {
        case welcome
        case email
        case code
        case profile
    }

    @Published var step: Step = .welcome
    @Published var serverText: String
    @Published var email = ""
    @Published var code = ""
    @Published private(set) var isWorking = false
    @Published private(set) var problem: String?

    private let accountController: AccountController

    init(accountController: AccountController, defaultServer: URL?) {
        self.accountController = accountController
        self.serverText = defaultServer?.absoluteString ?? ""
    }

    var isServerFieldShown: Bool { serverText.isEmpty || URL(string: serverText)?.host == nil }

    func signInWithGoogle() {
        guard let server = enteredServer() else { return }
        run { await self.accountController.signInWithGoogle(server: server) } onSuccess: { self.step = .profile }
    }

    func requestCode() {
        guard let server = enteredServer() else { return }
        run { await self.accountController.requestCode(server: server, email: self.email) } onSuccess: { self.step = .code }
    }

    func verifyCode() {
        guard let server = URL(string: serverText) else { return }
        run { await self.accountController.verifyCode(server: server, email: self.email, code: self.code) } onSuccess: { self.step = .profile }
    }

    private func enteredServer() -> URL? {
        guard let server = URL(string: serverText.trimmingCharacters(in: .whitespaces)), server.host != nil else {
            problem = "Enter your team's Digital Andon address, e.g. https://andon.yourteam.workers.dev"
            return nil
        }
        return server
    }

    func show(_ newStep: Step) {
        problem = nil
        step = newStep
    }

    private func run(_ operation: @escaping () async -> Result<Void, AndonError>, onSuccess: @escaping () -> Void) {
        isWorking = true
        problem = nil
        Task {
            let result = await operation()
            isWorking = false
            switch result {
            case .success:
                onSuccess()
            case let .failure(error):
                problem = error.message
            }
        }
    }
}
