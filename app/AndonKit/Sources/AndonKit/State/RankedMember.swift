import Foundation

public struct RankedMember: Equatable, Identifiable, Sendable {
    public let member: Member
    public let light: Light
    public let isOnline: Bool
    /// Everyone who has joined them, earliest first.
    public let helpers: [Member]

    public var id: MemberID { member.id }

    public var severity: Severity { Severity(of: light) }

    public init(member: Member, light: Light, isOnline: Bool, helpers: [Member] = []) {
        self.member = member
        self.light = light
        self.isOnline = isOnline
        self.helpers = helpers
    }

    /// A red that has waited ten minutes with nobody joining them.
    public func isBreathing(at now: Date) -> Bool {
        light.isBreathing(at: now) && helpers.isEmpty
    }
}

public enum Ranking {
    /// Red, amber, green, off; reds nobody has joined before reds being helped; within red and amber the
    /// longest-running first, otherwise the most recently changed first.
    public static func ranked(_ memberIDs: [MemberID], in state: TeamState) -> [RankedMember] {
        let rankedMembers = memberIDs.compactMap { memberID -> RankedMember? in
            guard let member = state.members[memberID], let light = state.light(for: memberID) else { return nil }
            return RankedMember(member: member, light: light, isOnline: state.online.contains(memberID), helpers: state.helpers(of: memberID))
        }
        return rankedMembers.sorted(by: isRankedBefore)
    }

    /// The people you follow, never including yourself.
    public static func followed(in state: TeamState) -> [RankedMember] {
        ranked(state.follows.filter { $0 != state.you }, in: state)
    }

    /// Everyone working who isn't with someone else, apart from you: who the join picker offers, most urgent first.
    /// Clear people can be joined too, so time spent with people who barely use Digital Andon still counts.
    public static func joinable(in state: TeamState) -> [RankedMember] {
        let candidates = state.members.keys.filter { memberID in
            guard memberID != state.you, let light = state.light(for: memberID) else { return false }
            return light.colour.isWorking && light.helping == nil
        }
        return ranked(Array(candidates), in: state)
    }

    private static func isRankedBefore(_ first: RankedMember, _ second: RankedMember) -> Bool {
        if first.severity != second.severity { return first.severity < second.severity }
        let isFirstHelped = !first.helpers.isEmpty
        let isSecondHelped = !second.helpers.isEmpty
        if first.light.colour == .red, isFirstHelped != isSecondHelped { return isSecondHelped }
        if first.light.since != second.light.since {
            let isRaised = first.light.colour.isRaised
            return isRaised ? first.light.since < second.light.since : first.light.since > second.light.since
        }
        return first.member.name.localizedCaseInsensitiveCompare(second.member.name) == .orderedAscending
    }
}
