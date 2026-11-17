import Foundation

public enum AlertStyle: String, Codable, CaseIterable, Sendable {
    case off
    case banner
    case bannerAndSound
}

public struct NotificationPreferences: Codable, Equatable, Sendable {
    public var red: AlertStyle
    public var amber: AlertStyle
    public var green: AlertStyle
    /// Minutes before one reminder about someone still red; 0 turns reminders off.
    public var reminderMinutes: Int
    /// Show colours only: no banners or sounds at all.
    public var isColoursOnly: Bool

    public static let standard = NotificationPreferences(red: .bannerAndSound, amber: .off, green: .off, reminderMinutes: 10, isColoursOnly: false)

    public init(red: AlertStyle, amber: AlertStyle, green: AlertStyle, reminderMinutes: Int, isColoursOnly: Bool) {
        self.red = red
        self.amber = amber
        self.green = green
        self.reminderMinutes = reminderMinutes
        self.isColoursOnly = isColoursOnly
    }

    /// Nil for off: switching off is never announced.
    public func style(for colour: Colour) -> AlertStyle? {
        switch colour {
        case .red: return red
        case .amber: return amber
        case .green: return green
        case .off: return nil
        }
    }
}

public struct Preferences: Equatable, Sendable {
    public var notifications: NotificationPreferences
    /// Disrupted and Blocked drawn brighter than white on screens that can (XDR), while plugged in. On by default.
    public var isBrightColours: Bool

    public static let standard = Preferences(notifications: .standard, isBrightColours: true)

    public init(notifications: NotificationPreferences, isBrightColours: Bool) {
        self.notifications = notifications
        self.isBrightColours = isBrightColours
    }
}

/// Missing keys fall back to defaults, so preferences saved by an older version still load.
extension Preferences: Codable {
    private enum CodingKeys: String, CodingKey {
        case notifications
        case isBrightColours
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.notifications = try container.decodeIfPresent(NotificationPreferences.self, forKey: .notifications) ?? .standard
        self.isBrightColours = try container.decodeIfPresent(Bool.self, forKey: .isBrightColours) ?? Preferences.standard.isBrightColours
    }
}
