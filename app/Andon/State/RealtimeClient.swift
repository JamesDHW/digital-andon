import AndonKit
import AppKit

/// One WebSocket to the team. Every (re)connect gets a full hello, so dropped messages never leave the app out of date.
@MainActor
final class RealtimeClient {
    var onMessage: ((ServerMessage) -> Void)?
    var onConnectionChange: ((ConnectionState) -> Void)?
    var onUnauthorised: (() -> Void)?

    private let urlSession = URLSession(configuration: .default)
    private var session: AccountSession?
    private var socket: URLSessionWebSocketTask?
    private var failedAttempts = 0
    private var lastReceivedAt = Date.distantPast
    private var reconnectTask: Task<Void, Never>?
    private var pingTimer: Timer?
    private var wakeObserver: NSObjectProtocol?

    init() {
        wakeObserver = NSWorkspace.shared.notificationCenter.addObserver(forName: NSWorkspace.didWakeNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.reconnectNow() }
        }
    }

    func connect(_ newSession: AccountSession) {
        session = newSession
        reconnectNow()
    }

    func disconnect() {
        session = nil
        closeSocket()
        onConnectionChange?(.signedOut)
    }

    func send(_ message: ClientMessage) -> Result<Void, AndonError> {
        guard let socket else { return .failure(AndonError(.network, "Not connected. Your change will need repeating once Andon reconnects.")) }
        return message.encoded().map { text in socket.send(.string(text)) { _ in } }
    }

    private func reconnectNow() {
        failedAttempts = 0
        closeSocket()
        open()
    }

    private func open() {
        guard let session, let request = APIRequest.socket(session) else { return }
        let socket = urlSession.webSocketTask(with: request)
        self.socket = socket
        lastReceivedAt = Date()
        onConnectionChange?(.connecting)
        socket.resume()
        receive(on: socket)
        startPinging()
    }

    private func receive(on socket: URLSessionWebSocketTask) {
        socket.receive { [weak self] result in
            Task { @MainActor in self?.handle(result, from: socket) }
        }
    }

    private func handle(_ result: Result<URLSessionWebSocketTask.Message, Error>, from socket: URLSessionWebSocketTask) {
        guard socket === self.socket else { return }
        switch result {
        case let .success(.string(text)):
            receivedText(text)
            receive(on: socket)
        case .success:
            receive(on: socket)
        case .failure:
            handleFailure(of: socket)
        }
    }

    private func receivedText(_ text: String) {
        lastReceivedAt = Date()
        if text == AppConstants.socketPongText { return }
        guard case let .success(message) = ServerMessage.decode(text) else { return }
        if case .hello = message {
            failedAttempts = 0
            onConnectionChange?(.connected)
        }
        if case .error(code: "unauthorised", message: _) = message {
            onUnauthorised?()
        }
        onMessage?(message)
    }

    private func handleFailure(of socket: URLSessionWebSocketTask) {
        let isRejected = (socket.response as? HTTPURLResponse)?.statusCode == 401
        guard !isRejected else {
            closeSocket()
            onUnauthorised?()
            return
        }
        scheduleReconnect()
    }

    private func scheduleReconnect() {
        closeSocket()
        guard session != nil else { return }
        onConnectionChange?(.disconnected)
        let delay = ReconnectPolicy.delaySeconds(afterFailedAttempts: failedAttempts)
        failedAttempts += 1
        reconnectTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            guard !Task.isCancelled else { return }
            self?.open()
        }
    }

    /// Text pings keep the connection alive through proxies; silence for too long means the socket is dead.
    private func startPinging() {
        pingTimer?.invalidate()
        pingTimer = Timer.scheduledTimer(withTimeInterval: AppConstants.socketPingSeconds, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.ping() }
        }
    }

    private func ping() {
        guard let socket else { return }
        let silence = Date().timeIntervalSince(lastReceivedAt)
        if silence > AppConstants.socketSilenceLimitSeconds { return handleFailure(of: socket) }
        socket.send(.string(AppConstants.socketPingText)) { _ in }
    }

    private func closeSocket() {
        reconnectTask?.cancel()
        reconnectTask = nil
        pingTimer?.invalidate()
        pingTimer = nil
        socket?.cancel(with: .normalClosure, reason: nil)
        socket = nil
    }
}
