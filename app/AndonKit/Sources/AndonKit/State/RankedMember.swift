import Foundation

public struct RankedMember: Equatable, Identifiable, Sendable {
    public let member: Member
    public let light: Light
    public let isOnline: Bool

    public var id: MemberID { member.id }

    public var severity: Severity { Severity(of: light) }

    public init(member: Member, light: Light, isOnline: Bool) {
        self.member = member
        self.light = light
        self.isOnline = isOnline
    }
}

public enum Ranking {
    /// Red, amber, green, off; within red and amber the longest-running first, otherwise the most recently changed first.
    public static func ranked(_ memberIDs: [MemberID], in state: TeamState) -> [RankedMember] {
        let rankedMembers = memberIDs.compactMap { memberID -> RankedMember? in
            guard let member = state.members[memberID], let light = state.light(for: memberID) else { return nil }
            return RankedMember(member: member, light: light, isOnline: state.online.contains(memberID))
        }
        return rankedMembers.sorted(by: isRankedBefore)
    }

    /// The people you follow, never including yourself.
    public static func followed(in state: TeamState) -> [RankedMember] {
        ranked(state.follows.filter { $0 != state.you }, in: state)
    }

    private static func isRankedBefore(_ first: RankedMember, _ second: RankedMember) -> Bool {
        if first.severity != second.severity { return first.severity < second.severity }
        if first.light.since != second.light.since {
            let isRaised = first.light.colour.isRaised
            return isRaised ? first.light.since < second.light.since : first.light.since > second.light.since
        }
        return first.member.name.localizedCaseInsensitiveCompare(second.member.name) == .orderedAscending
    }
}
