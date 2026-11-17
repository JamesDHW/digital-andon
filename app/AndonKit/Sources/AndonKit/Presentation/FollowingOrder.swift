import Foundation

/// The order of the Following screen: people you follow first, then everyone else, each alphabetical. The order is
/// fixed when the screen opens, so following or unfollowing someone never moves them while you're looking.
public enum FollowingOrder {
    /// Followed first, then everyone else, each alphabetical; you're left out.
    public static func initial(in state: TeamState) -> [MemberID] {
        let teammates = state.members.values.filter { $0.id != state.you }
        let followed = teammates.filter { state.isFollowing($0.id) }
        let others = teammates.filter { !state.isFollowing($0.id) }
        return alphabetical(followed) + alphabetical(others)
    }

    /// The order as it was when the screen opened, minus anyone who has left, plus anyone new at the end.
    public static func keeping(_ order: [MemberID], in state: TeamState) -> [MemberID] {
        let stillHere = order.filter { state.members[$0] != nil }
        let shown = Set(stillHere)
        let newcomers = state.members.values.filter { $0.id != state.you && !shown.contains($0.id) }
        return stillHere + alphabetical(newcomers)
    }

    /// Those whose name contains what you typed, ignoring case and accents; an empty search keeps everyone.
    public static func matching(_ order: [MemberID], search: String, in state: TeamState) -> [MemberID] {
        let query = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return order }
        return order.filter { memberID in
            guard let name = state.members[memberID]?.name else { return false }
            return name.range(of: query, options: [.caseInsensitive, .diacriticInsensitive]) != nil
        }
    }

    private static func alphabetical(_ members: [Member]) -> [MemberID] {
        members
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
            .map(\.id)
    }
}
