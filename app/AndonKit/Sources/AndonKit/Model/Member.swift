import Foundation

public enum MemberRole: String, Codable, Sendable {
    case member
    case admin
}

public struct Member: Codable, Equatable, Identifiable, Sendable {
    public let id: MemberID
    public let name: String
    public let email: String
    public let avatarUrl: URL?
    public let role: MemberRole
    public let joinedAt: Double

    public init(id: MemberID, name: String, email: String, avatarUrl: URL?, role: MemberRole, joinedAt: Double) {
        self.id = id
        self.name = name
        self.email = email
        self.avatarUrl = avatarUrl
        self.role = role
        self.joinedAt = joinedAt
    }

    /// Up to two initials, for the avatar fallback.
    public var initials: String {
        let words = name.split(separator: " ").prefix(2)
        return words.compactMap(\.first).map(String.init).joined().uppercased()
    }
}
