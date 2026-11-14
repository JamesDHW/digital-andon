import AndonKit

enum NotificationText {
    static func title(for announcement: Announcement, isReminder: Bool) -> String {
        if isReminder { return "\(announcement.memberName) is still stopped and waiting for someone" }
        switch announcement.colour {
        case .red: return "\(announcement.memberName) stopped and needs help"
        case .amber: return "\(announcement.memberName) is on watch"
        case .green: return "\(announcement.memberName) is clear again"
        case .off: return "\(announcement.memberName) is off"
        }
    }

    static func fallbackBody(for colour: Colour) -> String {
        switch colour {
        case .red: return "Stopped and needs help. No topic given."
        case .amber: return "Might need help soon."
        case .green: return "Unblocked."
        case .off: return "Not working right now."
        }
    }
}
