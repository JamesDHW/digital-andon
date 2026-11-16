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
    public let isBreathing: Bool

    public init(colour: Colour, isBreathing: Bool) {
        self.colour = colour
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
    /// When the next red on show reaches ten minutes and starts to breathe; nil when no red is waiting to.
    public let breathesNextAt: Date?

    public var isBreathing: Bool { ownLight?.isBreathing == true || people.contains(where: \.isBreathing) }

    /// Amber or red anywhere: the only colours that are ever drawn brighter than white.
    public var hasRaisedLight: Bool { ownLight?.colour.isRaised == true || people.contains { $0.colour.isRaised } }

    public var hasNothingToShow: Bool { ownLight == nil && people.isEmpty }

    public static func make(state: TeamState?, connection: ConnectionState, now: Date = Date()) -> MenuBarModel {
        guard let state else { return MenuBarModel(ownLight: nil, people: [], isDimmed: connection != .connected, breathesNextAt: nil) }
        let yourLight = state.light(for: state.you).flatMap { $0.colour.isWorking ? $0 : nil }
        let visible = visiblePeople(in: state)
        return MenuBarModel(
            ownLight: yourLight.map { OwnLightIndicator(colour: $0.colour, isBreathing: $0.isBreathing(at: now)) },
            people: visible.map { ranked in
                PersonIndicator(member: ranked.member, colour: ranked.light.colour, isBreathing: ranked.light.isBreathing(at: now), isStale: !ranked.isOnline)
            },
            isDimmed: connection != .connected,
            breathesNextAt: nextBreathingStart(of: [yourLight].compactMap { $0 } + visible.map(\.light), after: now)
        )
    }

    /// Off people disappear. A disconnected Mac's green is dropped too; a disconnected red or amber stays, faded.
    private static func visiblePeople(in state: TeamState) -> [RankedMember] {
        Ranking.followed(in: state)
            .filter { $0.light.colour.isWorking }
            .filter { $0.isOnline || $0.light.colour.isRaised }
    }

    /// Every change of colour gives a light a new `since`, so going green and back to red starts the ten minutes again.
    private static func nextBreathingStart(of lights: [Light], after now: Date) -> Date? {
        lights
            .filter { $0.colour == .red }
            .map { $0.sinceDate.addingTimeInterval(Light.breathingAfterSeconds) }
            .filter { $0 > now }
            .min()
    }
}
