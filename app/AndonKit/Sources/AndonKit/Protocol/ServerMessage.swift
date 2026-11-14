import Foundation

public enum ServerMessage: Equatable, Sendable {
    case hello(Hello)
    case light(Light)
    case presence(memberID: MemberID, isOnline: Bool)
    case member(Member)
    case memberRemoved(MemberID)
    case follows([MemberID])
    case error(code: String, message: String)
    /// A message type this version doesn't know; ignored so older apps keep working.
    case unknown(type: String)

    public static func decode(_ text: String) -> Result<ServerMessage, AndonError> {
        tryCatch(.decoding) { try JSONDecoder().decode(ServerMessage.self, from: Data(text.utf8)) }
    }
}

extension ServerMessage: Decodable {
    private enum CodingKeys: String, CodingKey {
        case type, light, memberId, isOnline, member, memberIds, code, message
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "hello":
            self = .hello(try Hello(from: decoder))
        case "light":
            self = .light(try container.decode(Light.self, forKey: .light))
        case "presence":
            self = .presence(memberID: try container.decode(MemberID.self, forKey: .memberId), isOnline: try container.decode(Bool.self, forKey: .isOnline))
        case "member":
            self = .member(try container.decode(Member.self, forKey: .member))
        case "memberRemoved":
            self = .memberRemoved(try container.decode(MemberID.self, forKey: .memberId))
        case "follows":
            self = .follows(try container.decode([MemberID].self, forKey: .memberIds))
        case "error":
            self = .error(code: try container.decode(String.self, forKey: .code), message: try container.decode(String.self, forKey: .message))
        default:
            self = .unknown(type: type)
        }
    }
}
