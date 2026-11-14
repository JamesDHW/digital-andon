import Foundation

/// Every failure the app handles is returned as a value of this type, never thrown past an adapter.
public struct AndonError: Error, Equatable, Sendable {
    public enum Kind: String, Equatable, Sendable {
        case invalidInput
        case network
        case unauthorised
        case server
        case decoding
        case keychain
        case unexpected
    }

    public let kind: Kind
    public let message: String

    public init(_ kind: Kind, _ message: String) {
        self.kind = kind
        self.message = message
    }
}
