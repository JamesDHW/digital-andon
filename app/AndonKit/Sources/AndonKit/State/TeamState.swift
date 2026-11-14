import Foundation

/// Everything one member's app knows about the team. Replaced wholesale on every hello; patched by later messages.
public struct TeamState: Equatable, Sendable {
    public let you: MemberID
    public let members: [MemberID: Member]
    public let lights: [MemberID: Light]
    public let follows: [MemberID]
    public let online: Set<MemberID>

    public init(you: MemberID, members: [MemberID: Member], lights: [MemberID: Light], follows: [MemberID], online: Set<MemberID>) {
        self.you = you
        self.members = members
        self.lights = lights
        self.follows = follows
        self.online = online
    }

    public init(hello: Hello) {
        self.init(
            you: hello.you,
            members: Dictionary(hello.members.map { ($0.id, $0) }, uniquingKeysWith: { _, latest in latest }),
            lights: Dictionary(hello.lights.map { ($0.memberId, $0) }, uniquingKeysWith: { _, latest in latest }),
            follows: hello.follows,
            online: Set(hello.online)
        )
    }

    public var yourLight: Light? { lights[you] }

    public var yourself: Member? { members[you] }

    public func light(for memberID: MemberID) -> Light? {
        if let light = lights[memberID] { return light }
        return members[memberID].map(Light.initial(for:))
    }

    public func isFollowing(_ memberID: MemberID) -> Bool {
        follows.contains(memberID)
    }

    /// Applies one server message. A hello is handled by the caller, which replaces the whole state.
    public func applying(_ message: ServerMessage) -> TeamState {
        switch message {
        case let .hello(hello):
            return TeamState(hello: hello)
        case let .light(light):
            return copy(lights: lights.merging([light.memberId: light]) { _, latest in latest })
        case let .presence(memberID, isOnline):
            return copy(online: isOnline ? online.union([memberID]) : online.subtracting([memberID]))
        case let .member(member):
            return copy(members: members.merging([member.id: member]) { _, latest in latest })
        case let .memberRemoved(memberID):
            return copy(
                members: members.filter { $0.key != memberID },
                lights: lights.filter { $0.key != memberID },
                follows: follows.filter { $0 != memberID },
                online: online.subtracting([memberID])
            )
        case let .follows(memberIDs):
            return copy(follows: memberIDs)
        case .error, .unknown:
            return self
        }
    }

    private func copy(
        members: [MemberID: Member]? = nil,
        lights: [MemberID: Light]? = nil,
        follows: [MemberID]? = nil,
        online: Set<MemberID>? = nil
    ) -> TeamState {
        TeamState(
            you: you,
            members: members ?? self.members,
            lights: lights ?? self.lights,
            follows: follows ?? self.follows,
            online: online ?? self.online
        )
    }
}
