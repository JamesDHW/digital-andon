import AndonKit
import AppKit
import Combine
import SwiftUI

/// The composition root: builds every part once and wires them together.
@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private static let onboardingWindow = "onboarding"

    private let environment: AppEnvironment
    private let preferencesStore: PreferencesStore
    private let accountController: AccountController
    private let teamStore: TeamStore
    private let notificationController: NotificationController
    private let windowPresenter: WindowPresenter
    private let navigation: DropdownNavigation
    private let screenLockWatcher: ScreenLockWatcher
    private let actions: AndonActions
    private let updater: UpdaterController
    private var statusItemController: StatusItemController?
    private var onboardingModel: OnboardingModel?
    private var subscriptions = Set<AnyCancellable>()

    override init() {
        let environment = AppEnvironment.current
        let preferencesStore = PreferencesStore()
        let teamStore = TeamStore(realtime: RealtimeClient())
        self.environment = environment
        self.preferencesStore = preferencesStore
        self.accountController = AccountController(
            sessionStore: KeychainSessionStore(),
            transport: HTTPTransport(urlSession: .shared),
            environment: environment
        )
        self.teamStore = teamStore
        self.notificationController = NotificationController()
        self.windowPresenter = WindowPresenter()
        self.navigation = DropdownNavigation()
        self.screenLockWatcher = ScreenLockWatcher()
        self.actions = AndonActions(teamStore: teamStore)
        self.updater = UpdaterController(isConfigured: environment.hasUpdateFeed)
        super.init()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.mainMenu = EditMenu.make()
        let dropdown = DropdownView(
            teamStore: teamStore,
            navigation: navigation,
            accountController: accountController,
            preferencesStore: preferencesStore,
            actions: actions,
            updater: updater
        )
        let statusItemController = StatusItemController(teamStore: teamStore, preferencesStore: preferencesStore, navigation: navigation, dropdown: dropdown)
        self.statusItemController = statusItemController
        wireActions(to: statusItemController)
        wireNotifications()
        HotkeyController.register(actions)
        screenLockWatcher.start(
            onLock: { [weak self] in self?.actions.screenLocked() },
            onUnlock: { [weak self] in self?.actions.screenUnlocked() }
        )
        followSession()
    }

    /// A change to your light still waiting to be sent goes out rather than being lost when the app quits.
    func applicationWillTerminate(_ notification: Notification) {
        actions.sendPendingChange()
    }

    private func wireActions(to statusItemController: StatusItemController) {
        actions.openOnboarding = { [weak self] in _ = self?.showOnboarding() }
        actions.showDropdown = { [weak statusItemController] page in statusItemController?.show(page) }
        actions.closeDropdown = { [weak statusItemController] in statusItemController?.closeDropdown() }
        actions.isDropdownShown = { [weak statusItemController] in statusItemController?.isDropdownShown ?? false }
    }

    private func wireNotifications() {
        notificationController.configure()
        notificationController.onOpen = { [weak self] in self?.actions.showDropdown(.team) }
        notificationController.onJoin = { [weak self] memberID in self?.actions.join(memberID) }
        teamStore.onStateChange = { [weak self] previous, current in
            guard let self else { return }
            if previous == nil {
                self.notificationController.withdrawAll()
            }
            let intents = NotificationPlanner.plan(from: previous, to: current, preferences: self.preferencesStore.preferences.notifications)
            self.notificationController.handle(intents)
        }
        teamStore.onUnauthorised = { [weak self] in self?.accountController.signOut() }
    }

    /// Signed in: connect. Signed out: disconnect and offer to join.
    private func followSession() {
        accountController.$session
            .removeDuplicates()
            .sink { [weak self] session in
                guard let self else { return }
                guard let session else {
                    self.teamStore.stop()
                    self.onboardingModel?.show(.welcome)
                    self.showOnboarding()
                    return
                }
                self.teamStore.start(session)
            }
            .store(in: &subscriptions)
    }

    /// Reuses the open onboarding window, so a join started from a link isn't interrupted.
    @discardableResult
    private func showOnboarding() -> OnboardingModel {
        let model = onboardingModel ?? OnboardingModel(accountController: accountController, defaultServer: environment.defaultServer)
        onboardingModel = model
        windowPresenter.show(Self.onboardingWindow, title: "Welcome to Digital Andon") {
            OnboardingView(model: model, teamStore: teamStore, accountController: accountController) { [weak self] in
                self?.windowPresenter.close(Self.onboardingWindow)
                self?.onboardingModel = nil
            }
        }
        return model
    }
}
