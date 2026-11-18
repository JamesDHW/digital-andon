import AndonKit
import AppKit
import Combine
import SwiftUI

/// Owns the menu bar item: redraws it whenever the team, the connection, a photo, the power source or Bright colours
/// change, or a red reaches ten minutes, and shows the dropdown. Nothing repeats on a timer; Core Animation breathes.
@MainActor
final class StatusItemController: NSObject, NSPopoverDelegate {
    private let statusItem: NSStatusItem
    private let popover: NSPopover
    private let teamStore: TeamStore
    private let preferencesStore: PreferencesStore
    private let navigation: DropdownNavigation
    private let avatarCache = AvatarImageCache()
    private var inputs = MenuBarInputs(state: nil, connection: .signedOut)
    private var model = MenuBarModel.make(state: nil, connection: .signedOut)
    private let imageView: StatusImageView
    private let powerSource: PowerSource
    private var breathingTimer: Timer?
    private var lastClosedAt = Date.distantPast
    private let focus = PopoverFocus()
    private var subscriptions = Set<AnyCancellable>()
    private var appearanceObservation: NSKeyValueObservation?

    init(teamStore: TeamStore, preferencesStore: PreferencesStore, navigation: DropdownNavigation, dropdown: DropdownView) {
        self.teamStore = teamStore
        self.preferencesStore = preferencesStore
        self.navigation = navigation
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        self.popover = NSPopover()
        self.imageView = StatusImageView(frame: .zero)
        self.powerSource = PowerSource()
        super.init()
        configurePopover(with: dropdown)
        configureButton()
        observeChanges()
    }

    var isDropdownShown: Bool { popover.isShown }

    /// Opens the popover on a page, or switches page if it's already open.
    func show(_ page: DropdownPage) {
        navigation.page = page
        showDropdown()
    }

    func showDropdown() {
        guard let button = statusItem.button, !popover.isShown else { return }
        focus.popoverWillOpen()
        navigation.opened()
        NSApp.activate()
        popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        popover.contentViewController?.view.window?.makeKey()
    }

    func closeDropdown() {
        popover.performClose(nil)
    }

    /// Closes the popover for one of the app's own windows (updates, sign-in) and opens it in front, rather than
    /// handing focus back to the app you were in, which would put the new window behind that app's windows.
    func handOverToOwnWindow(_ open: () -> Void) {
        if popover.isShown {
            focus.handOverToOwnWindow()
            closeDropdown()
        }
        NSApp.activate()
        open()
    }

    @objc private func toggleDropdown(_ sender: Any?) {
        if popover.isShown { return closeDropdown() }
        let isReopeningFromTheSameClick = Date().timeIntervalSince(lastClosedAt) < AppConstants.popoverReopenGuardSeconds
        if isReopeningFromTheSameClick { return }
        show(.team)
    }

    /// A click on the icon closes the transient popover on mouse-down; this stops mouse-up reopening it.
    func popoverDidClose(_ notification: Notification) {
        lastClosedAt = Date()
        navigation.page = .team
        focus.popoverDidClose()
    }

    private func configurePopover(with dropdown: DropdownView) {
        popover.behavior = .transient
        popover.animates = false
        popover.delegate = self
        let hostingController = NSHostingController(rootView: dropdown)
        hostingController.sizingOptions = [.preferredContentSize]
        popover.contentViewController = hostingController
    }

    private func configureButton() {
        guard let button = statusItem.button else { return }
        button.target = self
        button.action = #selector(toggleDropdown(_:))
        button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        button.imagePosition = .imageOnly
        button.addSubview(imageView)
        appearanceObservation = button.observe(\.effectiveAppearance) { [weak self] _, _ in
            Task { @MainActor in self?.render() }
        }
        render()
    }

    private func observeChanges() {
        teamStore.$state
            .combineLatest(teamStore.$connection)
            .receive(on: RunLoop.main)
            .sink { [weak self] state, connection in
                self?.inputs = MenuBarInputs(state: state, connection: connection)
                self?.refreshModel()
            }
            .store(in: &subscriptions)
        avatarCache.$revision
            .dropFirst()
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.render() }
            .store(in: &subscriptions)
        preferencesStore.$preferences
            .map(\.isBrightColours)
            .removeDuplicates()
            .dropFirst()
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.render() }
            .store(in: &subscriptions)
        powerSource.onChange = { [weak self] in self?.render() }
    }

    private func refreshModel() {
        let newModel = MenuBarModel.make(state: inputs.state, connection: inputs.connection, now: Date())
        guard newModel != model else { return }
        model = newModel
        scheduleBreathing(at: newModel.breathesNextAt)
        render()
    }

    /// A red starts breathing ten minutes in with no message from the server, so the app wakes once at that moment.
    /// Any change replaces the timer, so a red that went green in the meantime never sets off an old one.
    private func scheduleBreathing(at date: Date?) {
        breathingTimer?.invalidate()
        breathingTimer = nil
        guard let date else { return }
        let timer = Timer(fire: date, interval: 0, repeats: false) { [weak self] _ in
            MainActor.assumeIsolated { self?.refreshModel() }
        }
        timer.tolerance = AppConstants.breathingTimerToleranceSeconds
        RunLoop.main.add(timer, forMode: .common)
        breathingTimer = timer
    }

    /// Draws the light at full strength, plus its breathing low point when a red has waited ten minutes.
    private func render() {
        guard let button = statusItem.button else { return }
        let screen = button.window?.screen ?? NSScreen.main
        let scale = screen?.backingScaleFactor ?? 2
        let headroom = StatusBitmap.headroom(of: screen)
        let isBoosted = BrightColours.isBoosted(
            isEnabled: preferencesStore.preferences.isBrightColours,
            screenHeadroom: Double(headroom),
            hasRaisedLight: model.hasRaisedLight,
            canAffordBoost: powerSource.canAffordBoost
        )
        let isDarkMenuBar = button.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
        let photos = currentPhotos()
        let drawFrame = { (pulse: CGFloat) in
            StatusBitmap.make(
                for: self.model,
                rendering: LightRendering(brightness: isBoosted ? headroom : 1, pulse: pulse, isDarkMenuBar: isDarkMenuBar),
                photos: photos,
                backingScale: scale
            )
        }
        guard let image = drawFrame(0) else { return }
        button.setAccessibilityLabel(StatusImageRenderer.accessibilityDescription(for: model))
        let length = StatusImageRenderer.width(for: model) + AppConstants.statusItemPadding
        statusItem.length = length
        // Sized from the new length, not the button: the button only takes its new width a moment later, so its
        // bounds can still be the old, narrower width and would cut off the faces on the right.
        imageView.frame = NSRect(x: 0, y: 0, width: length, height: NSStatusBar.system.thickness)
        imageView.show(image, dimmed: model.isBreathing ? drawFrame(1) : nil, scale: scale, isBoosted: isBoosted)
    }

    /// Whatever photos have arrived; asking also starts fetching any that haven't.
    private func currentPhotos() -> [MemberID: NSImage] {
        let loaded = StatusImageRenderer.members(in: model).compactMap { member in
            avatarCache.image(for: member.avatarUrl).map { (member.id, $0) }
        }
        return Dictionary(loaded, uniquingKeysWith: { first, _ in first })
    }
}

/// The latest values the menu bar is drawn from, kept so the clock can recompute the model on its own.
private struct MenuBarInputs {
    let state: TeamState?
    let connection: ConnectionState
}
