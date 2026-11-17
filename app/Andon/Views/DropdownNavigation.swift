import Combine

/// Which page the menu bar popover is showing. Everything lives in the one popover hanging from the icon:
/// the team, your context, the join picker, who you follow and settings.
enum DropdownPage: Equatable {
    case team
    /// `returnsToTeam` when opened from the team page, so cancelling goes back there rather than closing.
    case context(returnsToTeam: Bool)
    case join
    case following
    case settings
}

@MainActor
final class DropdownNavigation: ObservableObject {
    @Published var page: DropdownPage = .team
}
