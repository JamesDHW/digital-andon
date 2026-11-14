import AndonKit
import AppKit
import UserNotifications

/// Posts what the NotificationPlanner decides, withdraws banners once someone leaves red, and opens the dropdown on a click.
@MainActor
final class NotificationController: NSObject, UNUserNotificationCenterDelegate {
    var onOpen: () -> Void = {}

    private let center = UNUserNotificationCenter.current()

    func configure() {
        center.delegate = self
        let redCategory = UNNotificationCategory(identifier: NotificationIdentifiers.redCategory, actions: [], intentIdentifiers: [], options: [])
        let changeCategory = UNNotificationCategory(identifier: NotificationIdentifiers.changeCategory, actions: [], intentIdentifiers: [], options: [])
        center.setNotificationCategories([redCategory, changeCategory])
    }

    func handle(_ intents: [NotificationIntent]) {
        for intent in intents {
            switch intent {
            case let .announce(announcement):
                announce(announcement)
            case let .withdraw(memberID):
                withdraw(memberID)
            }
        }
    }

    /// Asking every time is free once decided; the first time, the banner waits for the answer instead of being lost.
    private func announce(_ announcement: Announcement) {
        let pendingRequests = requests(for: announcement)
        let center = center
        center.requestAuthorization(options: [.alert, .sound]) { isGranted, _ in
            guard isGranted else { return }
            for request in pendingRequests {
                center.add(request)
            }
        }
    }

    func withdrawAll() {
        center.removeAllPendingNotificationRequests()
        center.removeAllDeliveredNotifications()
    }

    private func requests(for announcement: Announcement) -> [UNNotificationRequest] {
        let banner = UNNotificationRequest(
            identifier: NotificationIdentifiers.announcement(for: announcement.memberID),
            content: content(for: announcement, isReminder: false),
            trigger: nil
        )
        guard let reminderMinutes = announcement.reminderMinutes else { return [banner] }
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(reminderMinutes * 60), repeats: false)
        let reminder = UNNotificationRequest(
            identifier: NotificationIdentifiers.reminder(for: announcement.memberID),
            content: content(for: announcement, isReminder: true),
            trigger: trigger
        )
        return [banner, reminder]
    }

    private func withdraw(_ memberID: MemberID) {
        let identifiers = [NotificationIdentifiers.announcement(for: memberID), NotificationIdentifiers.reminder(for: memberID)]
        center.removeDeliveredNotifications(withIdentifiers: identifiers)
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
    }

    private func content(for announcement: Announcement, isReminder: Bool) -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        content.title = NotificationText.title(for: announcement, isReminder: isReminder)
        content.body = announcement.topic ?? NotificationText.fallbackBody(for: announcement.colour)
        content.threadIdentifier = announcement.memberID.rawValue
        content.categoryIdentifier = announcement.colour == .red ? NotificationIdentifiers.redCategory : NotificationIdentifiers.changeCategory
        content.userInfo = [NotificationIdentifiers.memberKey: announcement.memberID.rawValue]
        content.sound = announcement.style == .bannerAndSound ? .default : nil
        return content
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        Task { @MainActor in self.onOpen() }
        completionHandler()
    }

    /// Andon is a menu bar app, so it may count as frontmost: still show banners.
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .list])
    }
}
