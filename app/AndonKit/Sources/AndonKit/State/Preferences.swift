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

public struct PromptPreferences: Codable, Equatable, Sendable {
    /// After going green, ask "what unblocked you?" (always skippable).
    public var asksForResolutionNote: Bool

    public static let standard = PromptPreferences(asksForResolutionNote: false)

    public init(asksForResolutionNote: Bool) {
        self.asksForResolutionNote = asksForResolutionNote
    }
}

public struct Preferences: Equatable, Sendable {
    public var notifications: NotificationPreferences
    public var prompts: PromptPreferences

    public static let standard = Preferences(notifications: .standard, prompts: .standard)

    public init(notifications: NotificationPreferences, prompts: PromptPreferences) {
        self.notifications = notifications
        self.prompts = prompts
    }
}

/// Missing keys fall back to defaults, so preferences saved by an older version still load.
extension Preferences: Codable {
    private enum CodingKeys: String, CodingKey {
        case notifications, prompts
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.notifications = try container.decodeIfPresent(NotificationPreferences.self, forKey: .notifications) ?? .standard
        self.prompts = try container.decodeIfPresent(PromptPreferences.self, forKey: .prompts) ?? .standard
    }
}
