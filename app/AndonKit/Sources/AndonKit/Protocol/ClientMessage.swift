import Foundation

public enum ClientMessage: Equatable, Sendable {
    /// A nil topic keeps the current topic when the colour is unchanged.
    case pull(Colour, topic: String?)
    case topic(String)
    case note(String)
    case follow(MemberID)
    case unfollow(MemberID)

    public func encoded() -> Result<String, AndonError> {
        tryCatch(.unexpected) { String(decoding: try JSONEncoder().encode(self), as: UTF8.self) }
    }
}

extension ClientMessage: Encodable {
    private enum CodingKeys: String, CodingKey {
        case type, colour, topic, memberId, note
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case let .pull(colour, topic):
            try container.encode("pull", forKey: .type)
            try container.encode(colour, forKey: .colour)
            try container.encodeIfPresent(topic, forKey: .topic)
        case let .topic(topic):
            try container.encode("topic", forKey: .type)
            try container.encode(topic, forKey: .topic)
        case let .note(note):
            try container.encode("note", forKey: .type)
            try container.encode(note, forKey: .note)
        case let .follow(memberID):
            try container.encode("follow", forKey: .type)
            try container.encode(memberID, forKey: .memberId)
        case let .unfollow(memberID):
            try container.encode("unfollow", forKey: .type)
            try container.encode(memberID, forKey: .memberId)
        }
    }
}
