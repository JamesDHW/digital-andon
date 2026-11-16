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
    /// Red for ten minutes or more, with nobody joining them.
    public let isBreathing: Bool
    /// Their Mac has disconnected; shown faded because the light may be stale.
    public let isStale: Bool
    /// Whoever has joined them, drawn smaller behind their face, earliest first.
    public let helpers: [HelperIndicator]

    public var id: MemberID { member.id }

    public init(member: Member, colour: Colour, isBreathing: Bool, isStale: Bool, helpers: [HelperIndicator] = []) {
        self.member = member
        self.colour = colour
        self.isBreathing = isBreathing
        self.isStale = isStale
        self.helpers = helpers
    }
}

/// Someone who has joined a person, in their own light's colour.
public struct HelperIndicator: Equatable, Identifiable, Sendable {
    public let member: Member
    public let colour: Colour

    public var id: MemberID { member.id }

    public init(member: Member, colour: Colour) {
        self.member = member
        self.colour = colour
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
        let isYourRedHelped = state.isHelped(state.you)
        return MenuBarModel(
            ownLight: yourLight.map { OwnLightIndicator(colour: $0.colour, isBreathing: state.isBreathing(state.you, at: now)) },
            people: visible.map { ranked in
                PersonIndicator(
                    member: ranked.member,
                    colour: ranked.light.colour,
                    isBreathing: ranked.isBreathing(at: now),
                    isStale: !ranked.isOnline,
                    helpers: ranked.helpers.compactMap { helper in
                        state.light(for: helper.id).map { HelperIndicator(member: helper, colour: $0.colour) }
                    }
                )
            },
            isDimmed: connection != .connected,
            breathesNextAt: nextBreathingStart(
                of: (isYourRedHelped ? [] : [yourLight].compactMap { $0 }) + visible.filter { $0.helpers.isEmpty }.map(\.light),
                after: now
            )
        )
    }

    /// Off people disappear. A disconnected Mac's green is dropped too; a disconnected red or amber stays, faded.
    /// Someone with a person you can see is drawn behind that person instead of on their own.
    private static func visiblePeople(in state: TeamState) -> [RankedMember] {
        let working = Ranking.followed(in: state)
            .filter { $0.light.colour.isWorking }
            .filter { $0.isOnline || $0.light.colour.isRaised }
        let shownIDs = Set(working.map(\.id))
        return working.filter { ranked in
            guard let helping = ranked.light.helping else { return true }
            return !shownIDs.contains(helping)
        }
    }

    /// Every change of colour gives a light a new `since`, so going green and back to red starts the ten minutes again.
    /// A red someone has joined never breathes, so it's left out.
    private static func nextBreathingStart(of lights: [Light], after now: Date) -> Date? {
        lights
            .filter { $0.colour == .red }
            .map { $0.sinceDate.addingTimeInterval(Light.breathingAfterSeconds) }
            .filter { $0 > now }
            .min()
    }
}
