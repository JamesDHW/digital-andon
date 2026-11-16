import AndonKit
import AppKit
import Combine

/// Every command a person can give, wherever it comes from: a shortcut, the popover, a notification or the screen lock.
@MainActor
final class AndonActions {
    private let teamStore: TeamStore
    let sender: LightSender
    var openOnboarding: () -> Void = {}
    /// Opens the popover on a page, or switches page if it's already open.
    var showDropdown: (DropdownPage) -> Void = { _ in }
    var closeDropdown: () -> Void = {}
    var isDropdownShown: () -> Bool = { false }

    /// Your light just before you joined someone, so locking your screen while you're with them can put it back.
    private var lightBeforeJoin: Light?
    /// Your light when the screen locked, put back when it unlocks (and once connected, if the Mac slept meanwhile).
    private var lightWhenLocked: Light?
    private var isScreenLocked = false
    private var connectionWatch: AnyCancellable?

    init(teamStore: TeamStore) {
        self.teamStore = teamStore
        self.sender = LightSender(teamStore: teamStore)
        connectionWatch = teamStore.$connection
            .filter { $0 == .connected }
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.restoreAfterUnlock() }
    }

    /// From the popover's buttons. Going Blocked asks for context straight away; it can be left empty.
    func pull(_ colour: Colour) {
        let before = teamStore.yourLight?.colour
        sender.pull(colour)
        askForContextIfNewlyBlocked(before)
    }

    /// ⌃⌥↑ / ⌃⌥↓: step your light up or down.
    func cycle(_ direction: CycleDirection) {
        let before = teamStore.yourLight?.colour
        sender.step(direction)
        askForContextIfNewlyBlocked(before)
    }

    /// ⌃⌥O: off hides you from everyone's menu bar; pressing it again switches you back on as Clear.
    func toggleOff() {
        sender.toggleOff()
    }

    /// ⌃⌥S: your context, in the popover hanging from the menu bar icon.
    func editContext() {
        guard teamStore.yourLight != nil else { return }
        showDropdown(.context(returnsToTeam: isDropdownShown()))
    }

    func editContextFromDropdown() {
        showDropdown(.context(returnsToTeam: true))
    }

    /// Blank clears it; going Clear clears it too.
    func setContext(_ context: String) {
        sender.setStatus(context)
        closeDropdown()
    }

    /// Work with someone Disrupted or Blocked: you go Disrupted, "with" them, until either of you goes Clear or Off.
    func join(_ memberID: MemberID) {
        guard let light = teamStore.yourLight else { return }
        if light.helping == nil {
            lightBeforeJoin = light
        }
        sender.sendNow()
        teamStore.send(.join(memberID))
    }

    /// Your light goes back to what it was before you joined.
    func leave() {
        sender.sendNow()
        teamStore.send(.leave)
    }

    /// ⌃⌥J: with one person to join, join them; otherwise choose, most urgent first.
    func joinSomeone() {
        guard let state = teamStore.state else { return }
        let candidates = Ranking.joinable(in: state)
        if candidates.count == 1, let only = candidates.first, state.youAreHelping != only.id {
            return join(only.id)
        }
        showDropdown(.join)
    }

    func chooseFromJoinPicker(_ memberID: MemberID) {
        closeDropdown()
        if teamStore.state?.youAreHelping == memberID { return leave() }
        join(memberID)
    }

    /// Locking your screen switches you off at once, which also leaves anyone you'd joined.
    func screenLocked() {
        isScreenLocked = true
        guard let light = teamStore.yourLight else { return }
        lightWhenLocked = light.helping == nil ? light : (lightBeforeJoin ?? light.pulled(.green, atMilliseconds: light.since))
        closeDropdown()
        sender.pull(.off)
        sender.sendNow()
    }

    /// Unlocking puts your light back as it was, even if that was Off.
    func screenUnlocked() {
        isScreenLocked = false
        restoreAfterUnlock()
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

    private func askForContextIfNewlyBlocked(_ before: Colour?) {
        guard before != .red, teamStore.yourLight?.colour == .red else { return }
        showDropdown(.context(returnsToTeam: isDropdownShown()))
    }

    /// Waits for the connection after a sleep, so the change isn't lost.
    private func restoreAfterUnlock() {
        guard !isScreenLocked, teamStore.connection == .connected, let light = lightWhenLocked else { return }
        lightWhenLocked = nil
        sender.restore(light)
    }
}
