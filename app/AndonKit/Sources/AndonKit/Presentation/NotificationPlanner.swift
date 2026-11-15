import Foundation

public struct Announcement: Equatable, Sendable {
    public let memberID: MemberID
    public let memberName: String
    public let colour: Colour
    public let status: String?
    public let style: AlertStyle
    /// Minutes until one follow-up reminder, for reds only; cancelled as soon as they leave red.
    public let reminderMinutes: Int?
}

public enum NotificationIntent: Equatable, Sendable {
    case announce(Announcement)
    /// They left red: remove the banner and cancel its reminder.
    case withdraw(MemberID)
}

/// Decides which notifications a state change deserves. Pure, so the "don't spam me" policy is testable.
public enum NotificationPlanner {
    public static func plan(from previous: TeamState?, to current: TeamState, preferences: NotificationPreferences) -> [NotificationIntent] {
        let followedIDs = current.follows.filter { $0 != current.you }
        return followedIDs.flatMap { memberID in
            intents(for: memberID, previous: previous?.light(for: memberID), current: current, preferences: preferences)
        }
    }

    private static func intents(for memberID: MemberID, previous: Light?, current: TeamState, preferences: NotificationPreferences) -> [NotificationIntent] {
        guard let member = current.members[memberID], let light = current.light(for: memberID) else { return [] }
        let hasLeftRed = previous?.colour == .red && light.colour != .red
        let withdrawals: [NotificationIntent] = hasLeftRed ? [.withdraw(memberID)] : []
        guard isAnnounceable(previous: previous, current: light), let style = preferences.style(for: light.colour) else { return withdrawals }
        guard style != .off, !preferences.isColoursOnly else { return withdrawals }

        let reminderMinutes = light.colour == .red && preferences.reminderMinutes > 0 ? preferences.reminderMinutes : nil
        let announcement = Announcement(
            memberID: memberID, memberName: member.name, colour: light.colour, status: light.status, style: style, reminderMinutes: reminderMinutes
        )
        return withdrawals + [.announce(announcement)]
    }

    /// A new period (a colour change or a fresh pull) is announced; status edits are not.
    /// Going green only counts after amber or red, never when someone simply switches on.
    /// On first connect there is no previous state: only reds are announced.
    private static func isAnnounceable(previous: Light?, current: Light) -> Bool {
        guard let previous else { return current.colour == .red }
        let isNewPeriod = previous.colour != current.colour || previous.since != current.since
        guard isNewPeriod else { return false }
        if current.colour == .green { return previous.colour.isRaised }
        return current.colour.isRaised
    }
}
