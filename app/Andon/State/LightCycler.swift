import AndonKit
import Combine
import Foundation

/// The arrow shortcuts step your light locally and only send once you've stopped pressing for a moment,
/// so Stop ↓ ↓ is logged as one Stop → Clear, not via Watch. Landing back where you started sends nothing.
@MainActor
final class LightCycler: ObservableObject {
    @Published private(set) var pendingColour: Colour?

    /// Sends the settled colour; set by AndonActions so it follows the same path as any other pull.
    var onCommit: (Colour) -> Void = { _ in }

    private let teamStore: TeamStore
    private var sendTask: Task<Void, Never>?

    init(teamStore: TeamStore) {
        self.teamStore = teamStore
    }

    func step(_ direction: CycleDirection) {
        guard let state = teamStore.state, let current = state.light(for: state.you) else { return }
        pendingColour = LightCycle.next(after: pendingColour ?? current.colour, direction)
        scheduleCommit()
    }

    /// A direct pull (⌃⌥G/A/R or the dropdown) replaces whatever was being cycled.
    func cancel() {
        sendTask?.cancel()
        sendTask = nil
        pendingColour = nil
    }

    /// Sends immediately, e.g. when the app quits mid-delay.
    func commitNow() {
        guard let colour = pendingColour else { return }
        cancel()
        let currentColour = teamStore.state.flatMap { $0.light(for: $0.you) }?.colour
        guard colour != currentColour else { return }
        onCommit(colour)
    }

    private func scheduleCommit() {
        sendTask?.cancel()
        sendTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(AppConstants.cycleSendDelaySeconds * 1_000_000_000))
            guard !Task.isCancelled else { return }
            self?.commitNow()
        }
    }
}
