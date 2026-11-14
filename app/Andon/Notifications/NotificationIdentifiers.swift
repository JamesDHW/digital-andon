import AndonKit

/// Plain constants, readable from the notification delegate's nonisolated callbacks.
enum NotificationIdentifiers {
    static let redCategory = "andon.red"
    static let changeCategory = "andon.change"
    static let memberKey = "memberId"

    static func announcement(for memberID: MemberID) -> String { "andon-\(memberID.rawValue)" }

    static func reminder(for memberID: MemberID) -> String { "andon-reminder-\(memberID.rawValue)" }
}
