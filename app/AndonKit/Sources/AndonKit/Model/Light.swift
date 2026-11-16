import Foundation

/// One member's andon light. Times are milliseconds since 1970, as the server sends them.
public struct Light: Codable, Equatable, Sendable {
    /// A red that has waited this long starts to breathe: the cue for anyone else to come and help.
    public static let breathingAfterSeconds: TimeInterval = 10 * 60

    public let memberId: MemberID
    public let colour: Colour
    public let status: String?
    public let since: Double
    /// Who they've joined, if anyone: they're Disrupted, working with that person until either goes Clear or Off.
    /// Older servers don't send it, which reads as nobody.
    public let helping: MemberID?

    public init(memberId: MemberID, colour: Colour, status: String?, since: Double, helping: MemberID? = nil) {
        self.memberId = memberId
        self.colour = colour
        self.status = status
        self.since = since
        self.helping = helping
    }

    public var sinceDate: Date { Date(timeIntervalSince1970: since / 1000) }

    /// Red for at least ten minutes, worked out from the time alone: no extra state on the server.
    /// Someone who has been joined doesn't breathe; TeamState.isBreathing checks that.
    public func isBreathing(at now: Date) -> Bool {
        colour == .red && now.timeIntervalSince(sinceDate) >= Self.breathingAfterSeconds
    }

    public static func initial(for member: Member) -> Light {
        Light(memberId: member.id, colour: .green, status: nil, since: member.joinedAt)
    }
}
