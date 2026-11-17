import Foundation

public struct DropdownRow: Equatable, Identifiable, Sendable {
    public let rankedMember: RankedMember
    public let isFollowed: Bool

    public var id: MemberID { rankedMember.id }
}

/// The dropdown's sections, red first. Off and disconnected people are folded away at the bottom.
/// Anyone with you is left out: your own status shows them, rather than a row saying they're Disrupted.
public struct DropdownModel: Equatable, Sendable {
    public let red: [DropdownRow]
    public let amber: [DropdownRow]
    public let green: [DropdownRow]
    public let off: [DropdownRow]
    public let everyoneElse: [DropdownRow]
    public let yourLight: Light?

    public static let empty = DropdownModel(red: [], amber: [], green: [], off: [], everyoneElse: [], yourLight: nil)

    public static func make(state: TeamState) -> DropdownModel {
        let followedRows = Ranking.followed(in: state)
            .filter { $0.light.helping != state.you }
            .map { DropdownRow(rankedMember: $0, isFollowed: true) }
        let unfollowedIDs = state.members.keys.filter { $0 != state.you && !state.isFollowing($0) }
        let everyoneElse = Ranking.ranked(Array(unfollowedIDs), in: state)
            .filter { $0.light.helping != state.you }
            .sorted { $0.member.name.localizedCaseInsensitiveCompare($1.member.name) == .orderedAscending }
            .map { DropdownRow(rankedMember: $0, isFollowed: false) }

        return DropdownModel(
            red: followedRows.filter { $0.rankedMember.light.colour == .red },
            amber: followedRows.filter { $0.rankedMember.light.colour == .amber },
            green: followedRows.filter { $0.rankedMember.light.colour == .green && $0.rankedMember.isOnline },
            off: followedRows.filter { isAway($0.rankedMember) },
            everyoneElse: everyoneElse,
            yourLight: state.light(for: state.you)
        )
    }

    private static func isAway(_ rankedMember: RankedMember) -> Bool {
        rankedMember.light.colour == .off || (rankedMember.light.colour == .green && !rankedMember.isOnline)
    }
}
