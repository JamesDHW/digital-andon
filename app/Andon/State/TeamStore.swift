import AndonKit
import Combine
import Foundation

/// The team as this Mac sees it. Views observe it; every change is also handed to the notification planner.
@MainActor
final class TeamStore: ObservableObject {
    @Published private(set) var state: TeamState?
    @Published private(set) var connection: ConnectionState = .signedOut
    @Published private(set) var lastProblem: String?

    /// Called with the state before and after every change, including a reconnect's fresh hello.
    var onStateChange: ((TeamState?, TeamState) -> Void)?
    var onUnauthorised: (() -> Void)?

    private let realtime: RealtimeClient
    /// The last state seen, kept across reconnects so anything that happened while asleep is still announced.
    private var lastKnownState: TeamState?
    /// Your light as you've just set it, shown here (over anything the server says) until it has been sent.
    private var localLight: Light?

    init(realtime: RealtimeClient) {
        self.realtime = realtime
        realtime.onMessage = { [weak self] message in self?.apply(message) }
        realtime.onConnectionChange = { [weak self] connection in self?.connection = connection }
        realtime.onUnauthorised = { [weak self] in self?.onUnauthorised?() }
    }

    func start(_ session: AccountSession) {
        realtime.connect(session)
    }

    func stop() {
        realtime.disconnect()
        state = nil
        lastKnownState = nil
        localLight = nil
    }

    var yourLight: Light? {
        guard let state else { return nil }
        return state.light(for: state.you)
    }

    /// Shows a change to your light at once, before it's sent.
    func showYourLight(_ light: Light) {
        localLight = light
        guard let state else { return }
        replaceState(state.applying(.light(light)))
    }

    /// The change has been sent (or undone): the server's word counts again. Pass a light to show it straight away.
    func settleYourLight(showing light: Light?) {
        localLight = nil
        guard let light, let state else { return }
        replaceState(state.applying(.light(light)))
    }

    func send(_ message: ClientMessage) {
        guard case let .failure(error) = realtime.send(message) else { return }
        lastProblem = error.message
    }

    func clearProblem() {
        lastProblem = nil
    }

    private func apply(_ message: ServerMessage) {
        switch message {
        case let .hello(hello):
            replaceState(withLocalLight(TeamState(hello: hello)))
        case let .error(_, problem):
            lastProblem = problem
        case .light, .presence, .member, .memberRemoved, .follows, .unknown:
            guard let state else { return }
            replaceState(withLocalLight(state.applying(message)))
        }
    }

    private func withLocalLight(_ newState: TeamState) -> TeamState {
        guard let localLight, localLight.memberId == newState.you else { return newState }
        return newState.applying(.light(localLight))
    }

    private func replaceState(_ newState: TeamState) {
        let previous = lastKnownState
        state = newState
        lastKnownState = newState
        onStateChange?(previous, newState)
    }
}
