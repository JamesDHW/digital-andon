import AndonKit

/// Plain constants, readable from the notification delegate's nonisolated callbacks.
enum NotificationIdentifiers {
    /// Disrupted or Blocked: the banner has a Join button.
    static let raisedCategory = "andon.raised"
    static let joinAction = "andon.join"
    static let changeCategory = "andon.change"
    static let memberKey = "memberId"

    static func announcement(for memberID: MemberID) -> String { "andon-\(memberID.rawValue)" }

    static func reminder(for memberID: MemberID) -> String { "andon-reminder-\(memberID.rawValue)" }
}
