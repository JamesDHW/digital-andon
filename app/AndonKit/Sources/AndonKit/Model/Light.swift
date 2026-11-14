import Foundation

/// One member's andon light. Times are milliseconds since 1970, as the server sends them.
public struct Light: Codable, Equatable, Sendable {
    /// A red that has waited this long starts to breathe: the cue for anyone else to come and help.
    public static let breathingAfterSeconds: TimeInterval = 10 * 60

    public let memberId: MemberID
    public let colour: Colour
    public let topic: String?
    public let since: Double

    public init(memberId: MemberID, colour: Colour, topic: String?, since: Double) {
        self.memberId = memberId
        self.colour = colour
        self.topic = topic
        self.since = since
    }

    public var sinceDate: Date { Date(timeIntervalSince1970: since / 1000) }

    /// Red for at least ten minutes, worked out from the time alone: no extra state on the server.
    public func isBreathing(at now: Date) -> Bool {
        colour == .red && now.timeIntervalSince(sinceDate) >= Self.breathingAfterSeconds
    }

    public static func initial(for member: Member) -> Light {
        Light(memberId: member.id, colour: .green, topic: nil, since: member.joinedAt)
    }
}
