import Foundation

/// What a signed-in Mac keeps in the Keychain. Who "you" are arrives in the hello message.
public struct AccountSession: Codable, Equatable, Sendable {
    public let server: URL
    public let deviceToken: String

    public init(server: URL, deviceToken: String) {
        self.server = server
        self.deviceToken = deviceToken
    }

    /// The socket URL: the server's origin with ws(s) in place of http(s).
    public var socketURL: URL? {
        guard var components = URLComponents(url: server, resolvingAgainstBaseURL: false) else { return nil }
        components.scheme = components.scheme == "http" ? "ws" : "wss"
        components.path = "/ws"
        return components.url
    }
}

public struct SignedInDevice: Codable, Equatable, Sendable {
    public let deviceToken: String
    public let memberId: MemberID
}

public struct ServerErrorBody: Codable, Equatable, Sendable {
    public let code: String
    public let message: String
}
