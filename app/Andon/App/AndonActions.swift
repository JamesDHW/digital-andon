import AndonKit
import AppKit

/// Every command a person can give, wherever it comes from: a shortcut, the dropdown or a notification.
@MainActor
final class AndonActions {
    private let teamStore: TeamStore
    private let preferencesStore: PreferencesStore
    private let prompt: TextPromptPresenter
    let cycler: LightCycler
    var openSettings: () -> Void = {}
    var openOnboarding: () -> Void = {}
    var openDropdown: () -> Void = {}
    var closeDropdown: () -> Void = {}

    init(teamStore: TeamStore, preferencesStore: PreferencesStore, prompt: TextPromptPresenter) {
        self.teamStore = teamStore
        self.preferencesStore = preferencesStore
        self.prompt = prompt
        self.cycler = LightCycler(teamStore: teamStore)
        cycler.onCommit = { [weak self] colour in self?.commitPull(colour) }
    }

    /// Instant: no prompt. Replaces anything being stepped with the arrow shortcuts.
    func pull(_ colour: Colour) {
        cycler.cancel()
        commitPull(colour)
    }

    /// ⌃⌥↑ / ⌃⌥↓: step your light; it's sent once you stop pressing for a moment.
    func cycle(_ direction: CycleDirection) {
        cycler.step(direction)
    }

    func sendPendingCycle() {
        cycler.commitNow()
    }

    /// Going clear may ask what unblocked you, if that's switched on.
    private func commitPull(_ colour: Colour) {
        let wasStopped = teamStore.state.flatMap { $0.light(for: $0.you) }?.colour.isRaised ?? false
        teamStore.pull(colour, topic: nil)
        let shouldAskForNote = colour == .green && wasStopped && preferencesStore.preferences.prompts.asksForResolutionNote
        if shouldAskForNote {
            askForResolutionNote()
        }
    }

    func pullWithTopic(_ colour: Colour) {
        cycler.cancel()
        closeDropdown()
        prompt.present(TextPrompt.topic(for: colour, current: nil)) { [weak self] topic in
            self?.teamStore.pull(colour, topic: Self.nonBlank(topic))
        }
    }

    func editTopic() {
        guard let state = teamStore.state, let light = state.light(for: state.you), light.colour.isRaised else { return }
        closeDropdown()
        prompt.present(TextPrompt.topic(for: light.colour, current: light.topic)) { [weak self] topic in
            self?.teamStore.send(.topic(topic))
        }
    }

    /// ⌃⌥O: off hides you from everyone's menu bar; pressing it again switches you back on as Clear.
    func toggleOff() {
        let isOff = teamStore.state.flatMap { $0.light(for: $0.you) }?.colour == .off
        pull(isOff ? .green : .off)
    }

    func follow(_ memberID: MemberID) {
        teamStore.send(.follow(memberID))
    }

    func unfollow(_ memberID: MemberID) {
        teamStore.send(.unfollow(memberID))
    }

    func setColoursOnly(_ isColoursOnly: Bool) {
        preferencesStore.preferences.notifications.isColoursOnly = isColoursOnly
    }

    func quit() {
        NSApp.terminate(nil)
    }

    private func askForResolutionNote() {
        prompt.present(.resolutionNote) { [weak self] note in
            guard let trimmedNote = Self.nonBlank(note) else { return }
            self?.teamStore.send(.note(trimmedNote))
        }
    }

    private static func nonBlank(_ text: String) -> String? {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedText.isEmpty { return nil }
        return trimmedText
    }
}
