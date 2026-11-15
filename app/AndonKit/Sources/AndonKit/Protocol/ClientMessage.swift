import Foundation

public enum ClientMessage: Equatable, Sendable {
    /// Sends your whole light at once. The status is always sent, so a blank one clears it on the server.
    case pull(Colour, status: String?)
    case follow(MemberID)
    case unfollow(MemberID)

    public func encoded() -> Result<String, AndonError> {
        tryCatch(.unexpected) { String(decoding: try JSONEncoder().encode(self), as: UTF8.self) }
    }
}

extension ClientMessage: Encodable {
    private enum CodingKeys: String, CodingKey {
        case type, colour, status, memberId
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case let .pull(colour, status):
            try container.encode("pull", forKey: .type)
            try container.encode(colour, forKey: .colour)
            try container.encode(status ?? "", forKey: .status)
        case let .follow(memberID):
            try container.encode("follow", forKey: .type)
            try container.encode(memberID, forKey: .memberId)
        case let .unfollow(memberID):
            try container.encode("unfollow", forKey: .type)
            try container.encode(memberID, forKey: .memberId)
        }
    }
}
