import AndonKit
import AppKit

/// Every command a person can give, wherever it comes from: a shortcut, the dropdown or a notification.
@MainActor
final class AndonActions {
    private let teamStore: TeamStore
    private let prompt: TextPromptPresenter
    let sender: LightSender
    var openSettings: () -> Void = {}
    var openOnboarding: () -> Void = {}
    var openDropdown: () -> Void = {}
    var closeDropdown: () -> Void = {}

    init(teamStore: TeamStore, prompt: TextPromptPresenter) {
        self.teamStore = teamStore
        self.prompt = prompt
        self.sender = LightSender(teamStore: teamStore)
    }

    /// From the dropdown's buttons.
    func pull(_ colour: Colour) {
        sender.pull(colour)
    }

    /// ⌃⌥↑ / ⌃⌥↓: step your light up or down.
    func cycle(_ direction: CycleDirection) {
        sender.step(direction)
    }

    /// ⌃⌥O: off hides you from everyone's menu bar; pressing it again switches you back on as Clear.
    func toggleOff() {
        sender.toggleOff()
    }

    /// ⌃⌥S or the dropdown: one line saying what you're doing. Blank clears it; going Clear clears it too.
    func editStatus() {
        guard let light = teamStore.yourLight else { return }
        closeDropdown()
        prompt.present(TextPrompt.status(colour: light.colour, current: light.status)) { [weak self] status in
            self?.sender.setStatus(status)
        }
    }

    func sendPendingChange() {
        sender.sendNow()
    }

    func follow(_ memberID: MemberID) {
        teamStore.send(.follow(memberID))
    }

    func unfollow(_ memberID: MemberID) {
        teamStore.send(.unfollow(memberID))
    }

    func quit() {
        NSApp.terminate(nil)
    }
}
