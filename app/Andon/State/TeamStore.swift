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
    }

    /// Pulls show immediately in the menu bar; the server's echo then replaces the guess.
    func pull(_ colour: Colour, topic: String?) {
        if let state, let current = state.light(for: state.you) {
            replaceState(state.applying(.light(current.pulled(colour, topic: topic, atMilliseconds: Date().timeIntervalSince1970 * 1000))))
        }
        send(.pull(colour, topic: topic))
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
            replaceState(TeamState(hello: hello))
        case let .error(_, problem):
            lastProblem = problem
        case .light, .presence, .member, .memberRemoved, .follows, .unknown:
            guard let state else { return }
            replaceState(state.applying(message))
        }
    }

    private func replaceState(_ newState: TeamState) {
        let previous = lastKnownState
        state = newState
        lastKnownState = newState
        onStateChange?(previous, newState)
    }
}
