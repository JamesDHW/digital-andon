import AndonKit
import AppKit
import Combine
import SwiftUI

/// Owns the menu bar item: redraws it whenever the team, the connection, a photo or the clock changes, and shows the dropdown.
@MainActor
final class StatusItemController: NSObject, NSPopoverDelegate {
    private let statusItem: NSStatusItem
    private let popover: NSPopover
    private let teamStore: TeamStore
    private let cycler: LightCycler
    private let avatarCache = AvatarImageCache()
    private var inputs = MenuBarInputs(state: nil, connection: .signedOut, pendingColour: nil)
    private var model = MenuBarModel.make(state: nil, connection: .signedOut)
    private let highDynamicRangeView: HighDynamicRangeImageView
    private var pulseTimer: Timer?
    private var clockTimer: Timer?
    private var pulseStartedAt = Date()
    private var lastClosedAt = Date.distantPast
    private var subscriptions = Set<AnyCancellable>()
    private var appearanceObservation: NSKeyValueObservation?

    init(teamStore: TeamStore, cycler: LightCycler, dropdown: DropdownView) {
        self.teamStore = teamStore
        self.cycler = cycler
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        self.popover = NSPopover()
        self.highDynamicRangeView = HighDynamicRangeImageView(frame: .zero)
        super.init()
        configurePopover(with: dropdown)
        configureButton()
        observeChanges()
    }

    func showDropdown() {
        guard let button = statusItem.button, !popover.isShown else { return }
        NSApp.activate()
        popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        popover.contentViewController?.view.window?.makeKey()
    }

    func closeDropdown() {
        popover.performClose(nil)
    }

    @objc private func toggleDropdown(_ sender: Any?) {
        if popover.isShown { return closeDropdown() }
        let isReopeningFromTheSameClick = Date().timeIntervalSince(lastClosedAt) < AppConstants.popoverReopenGuardSeconds
        if isReopeningFromTheSameClick { return }
        showDropdown()
    }

    /// A click on the icon closes the transient popover on mouse-down; this stops mouse-up reopening it.
    func popoverDidClose(_ notification: Notification) {
        lastClosedAt = Date()
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
        highDynamicRangeView.frame = button.bounds
        highDynamicRangeView.isHidden = true
        button.addSubview(highDynamicRangeView)
        appearanceObservation = button.observe(\.effectiveAppearance) { [weak self] _, _ in
            Task { @MainActor in self?.render() }
        }
        render()
    }

    private func observeChanges() {
        teamStore.$state
            .combineLatest(teamStore.$connection, cycler.$pendingColour)
            .receive(on: RunLoop.main)
            .sink { [weak self] state, connection, pendingColour in
                self?.inputs = MenuBarInputs(state: state, connection: connection, pendingColour: pendingColour)
                self?.refreshModel()
            }
            .store(in: &subscriptions)
        avatarCache.$revision
            .dropFirst()
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.render() }
            .store(in: &subscriptions)
        // A red starts breathing ten minutes in with no message from the server, so the clock has to drive it.
        clockTimer = Timer.scheduledTimer(withTimeInterval: AppConstants.menuBarClockSeconds, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.refreshModel() }
        }
    }

    private func refreshModel() {
        let newModel = MenuBarModel.make(state: inputs.state, connection: inputs.connection, pendingOwnColour: inputs.pendingColour, now: Date())
        guard newModel != model else { return }
        model = newModel
        updatePulsing()
        render()
    }

    private func render() {
        guard let button = statusItem.button else { return }
        let elapsed = Date().timeIntervalSince(pulseStartedAt)
        let pulse = CGFloat((1 - cos(2 * .pi * elapsed / AppConstants.pulsePeriodSeconds)) / 2)
        let screen = button.window?.screen ?? NSScreen.main
        let brightness = HighDynamicRangeImage.headroom(of: screen)
        let isHighDynamicRange = brightness > 1
        let isDarkMenuBar = button.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
        let rendering = LightRendering(
            brightness: isHighDynamicRange ? brightness : 1,
            pulse: pulse,
            isDarkMenuBar: isDarkMenuBar
        )
        button.setAccessibilityLabel(StatusImageRenderer.accessibilityDescription(for: model))
        let photos = currentPhotos()

        let highDynamicRangeImage = isHighDynamicRange
            ? HighDynamicRangeImage.make(for: model, rendering: rendering, photos: photos, backingScale: screen?.backingScaleFactor ?? 2)
            : nil
        guard let highDynamicRangeImage else { return showStandardImage(StatusImageRenderer.image(for: model, rendering: rendering, photos: photos)) }
        showHighDynamicRangeImage(highDynamicRangeImage)
    }

    /// Whatever photos have arrived; asking also starts fetching any that haven't.
    private func currentPhotos() -> [MemberID: NSImage] {
        let loaded = model.people.compactMap { person in
            avatarCache.image(for: person.member.avatarUrl).map { (person.id, $0) }
        }
        return Dictionary(loaded, uniquingKeysWith: { first, _ in first })
    }

    private func showStandardImage(_ image: NSImage) {
        highDynamicRangeView.isHidden = true
        statusItem.length = NSStatusItem.variableLength
        statusItem.button?.image = image
    }

    /// The button keeps its size and clicks; an image view on top shows the extended-range image.
    private func showHighDynamicRangeImage(_ image: NSImage) {
        statusItem.button?.image = nil
        statusItem.length = image.size.width + AppConstants.statusItemPadding
        highDynamicRangeView.image = image
        highDynamicRangeView.isHidden = false
        if let button = statusItem.button {
            highDynamicRangeView.frame = button.bounds
        }
    }

    /// A red that has waited ten minutes breathes; otherwise nothing animates.
    private func updatePulsing() {
        guard model.isBreathing else {
            pulseTimer?.invalidate()
            pulseTimer = nil
            return
        }
        guard pulseTimer == nil else { return }
        pulseStartedAt = Date()
        pulseTimer = Timer.scheduledTimer(withTimeInterval: AppConstants.pulseFrameSeconds, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.render() }
        }
    }
}

/// The latest values the menu bar is drawn from, kept so the clock can recompute the model on its own.
private struct MenuBarInputs {
    let state: TeamState?
    let connection: ConnectionState
    let pendingColour: Colour?
}
