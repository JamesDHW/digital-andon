import AndonKit
import AppKit
import Combine
import SwiftUI

/// The composition root: builds every part once and wires them together.
@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private static let settingsWindow = "settings"
    private static let onboardingWindow = "onboarding"

    private let environment: AppEnvironment
    private let preferencesStore: PreferencesStore
    private let accountController: AccountController
    private let teamStore: TeamStore
    private let notificationController: NotificationController
    private let promptPresenter: TextPromptPresenter
    private let windowPresenter: WindowPresenter
    private let actions: AndonActions
    private let updater: UpdaterController
    private var statusItemController: StatusItemController?
    private var onboardingModel: OnboardingModel?
    private var subscriptions = Set<AnyCancellable>()

    override init() {
        let environment = AppEnvironment.current
        let preferencesStore = PreferencesStore()
        let teamStore = TeamStore(realtime: RealtimeClient())
        let promptPresenter = TextPromptPresenter()
        self.environment = environment
        self.preferencesStore = preferencesStore
        self.accountController = AccountController(
            sessionStore: KeychainSessionStore(),
            transport: HTTPTransport(urlSession: .shared),
            environment: environment
        )
        self.teamStore = teamStore
        self.notificationController = NotificationController()
        self.promptPresenter = promptPresenter
        self.windowPresenter = WindowPresenter()
        self.actions = AndonActions(teamStore: teamStore, prompt: promptPresenter)
        self.updater = UpdaterController(isConfigured: environment.hasUpdateFeed)
        super.init()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.mainMenu = EditMenu.make()
        let dropdown = DropdownView(teamStore: teamStore, actions: actions)
        let statusItemController = StatusItemController(teamStore: teamStore, dropdown: dropdown)
        self.statusItemController = statusItemController
        wireActions(to: statusItemController)
        wireNotifications()
        HotkeyController.register(actions)
        followSession()
    }

    /// A change to your light still waiting to be sent goes out rather than being lost when the app quits.
    func applicationWillTerminate(_ notification: Notification) {
        actions.sendPendingChange()
    }

    /// andon://join links from the invite page.
    func application(_ application: NSApplication, open urls: [URL]) {
        guard let invitation = urls.lazy.compactMap({ JoinInvitation.parse($0.absoluteString) }).first else { return }
        let model = showOnboarding()
        model.joinFromLink(invitation)
    }

    private func wireActions(to statusItemController: StatusItemController) {
        actions.openSettings = { [weak self] in self?.showSettings() }
        actions.openOnboarding = { [weak self] in _ = self?.showOnboarding() }
        actions.openDropdown = { [weak statusItemController] in statusItemController?.showDropdown() }
        actions.closeDropdown = { [weak statusItemController] in statusItemController?.closeDropdown() }
    }

    private func wireNotifications() {
        notificationController.configure()
        notificationController.onOpen = { [weak self] in self?.actions.openDropdown() }
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
                    self.onboardingModel?.show(.invite)
                    self.showOnboarding()
                    return
                }
                self.teamStore.start(session)
            }
            .store(in: &subscriptions)
    }

    private func showSettings() {
        windowPresenter.show(Self.settingsWindow, title: "Digital Andon Settings") {
            SettingsView(accountController: accountController, teamStore: teamStore, preferencesStore: preferencesStore, actions: actions, updater: updater)
        }
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
