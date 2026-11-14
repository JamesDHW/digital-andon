import Foundation

public enum ConnectionState: Equatable, Sendable {
    case signedOut
    case connecting
    case connected
    case disconnected
}

/// Your own light: a solid block, shown whenever you're working so you never forget it's on.
public struct OwnLightIndicator: Equatable, Sendable {
    public let colour: Colour
    /// Changed with the arrow shortcuts and not sent yet: drawn as an outline until it is.
    public let isPending: Bool
    public let isBreathing: Bool

    public init(colour: Colour, isPending: Bool, isBreathing: Bool) {
        self.colour = colour
        self.isPending = isPending
        self.isBreathing = isBreathing
    }
}

/// One person you follow: their photo (or initial) inside a ring in their light's colour.
public struct PersonIndicator: Equatable, Identifiable, Sendable {
    public let member: Member
    public let colour: Colour
    /// Red for ten minutes or more.
    public let isBreathing: Bool
    /// Their Mac has disconnected; shown faded because the light may be stale.
    public let isStale: Bool

    public var id: MemberID { member.id }

    public init(member: Member, colour: Colour, isBreathing: Bool, isStale: Bool) {
        self.member = member
        self.colour = colour
        self.isBreathing = isBreathing
        self.isStale = isStale
    }
}

/// What the status item draws: your light (unless you're off), then everyone you follow who is working, red first.
public struct MenuBarModel: Equatable, Sendable {
    public let ownLight: OwnLightIndicator?
    public let people: [PersonIndicator]
    public let isDimmed: Bool

    public var isBreathing: Bool { ownLight?.isBreathing == true || people.contains(where: \.isBreathing) }

    public var hasNothingToShow: Bool { ownLight == nil && people.isEmpty }

    public static func make(state: TeamState?, connection: ConnectionState, pendingOwnColour: Colour? = nil, now: Date = Date()) -> MenuBarModel {
        guard let state else { return MenuBarModel(ownLight: nil, people: [], isDimmed: connection != .connected) }
        return MenuBarModel(
            ownLight: ownLight(in: state, pendingOwnColour: pendingOwnColour, now: now),
            people: visiblePeople(in: state, now: now),
            isDimmed: connection != .connected
        )
    }

    private static func ownLight(in state: TeamState, pendingOwnColour: Colour?, now: Date) -> OwnLightIndicator? {
        guard let light = state.light(for: state.you) else { return nil }
        let colour = pendingOwnColour ?? light.colour
        guard colour.isWorking else { return nil }
        let isPending = pendingOwnColour != nil
        return OwnLightIndicator(colour: colour, isPending: isPending, isBreathing: !isPending && light.isBreathing(at: now))
    }

    /// Off people disappear. A disconnected Mac's green is dropped too; a disconnected red or amber stays, faded.
    private static func visiblePeople(in state: TeamState, now: Date) -> [PersonIndicator] {
        Ranking.followed(in: state)
            .filter { $0.light.colour.isWorking }
            .filter { $0.isOnline || $0.light.colour.isRaised }
            .map { ranked in
                PersonIndicator(member: ranked.member, colour: ranked.light.colour, isBreathing: ranked.light.isBreathing(at: now), isStale: !ranked.isOnline)
            }
    }
}
