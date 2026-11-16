import Foundation

/// Tells you when the screen locks and unlocks, from the system's own notifications: nothing is polled.
@MainActor
final class ScreenLockWatcher {
    private static let lockedName = Notification.Name("com.apple.screenIsLocked")
    private static let unlockedName = Notification.Name("com.apple.screenIsUnlocked")

    private var observers: [NSObjectProtocol] = []

    func start(onLock: @escaping () -> Void, onUnlock: @escaping () -> Void) {
        let center = DistributedNotificationCenter.default()
        observers = [
            center.addObserver(forName: Self.lockedName, object: nil, queue: .main) { _ in
                MainActor.assumeIsolated { onLock() }
            },
            center.addObserver(forName: Self.unlockedName, object: nil, queue: .main) { _ in
                MainActor.assumeIsolated { onUnlock() }
            },
        ]
    }
}
