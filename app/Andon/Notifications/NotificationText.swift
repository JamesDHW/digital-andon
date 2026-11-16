import AndonKit

enum NotificationText {
    static func title(for announcement: Announcement, isReminder: Bool) -> String {
        if isReminder { return "\(announcement.memberName) is still blocked and waiting for someone" }
        switch announcement.colour {
        case .red: return "\(announcement.memberName) is blocked and needs help"
        case .amber: return "\(announcement.memberName) is disrupted"
        case .green: return "\(announcement.memberName) is clear again"
        case .off: return "\(announcement.memberName) is off"
        }
    }

    static func fallbackBody(for colour: Colour) -> String {
        switch colour {
        case .red: return "Blocked and needs help."
        case .amber: return "Slowed down by an unexpected complication."
        case .green: return "Unblocked."
        case .off: return "Not working right now."
        }
    }
}
