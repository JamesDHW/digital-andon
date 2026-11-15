import AndonKit
import Foundation

/// Your light changes on your own screen the moment you change it, but only reaches everyone else once it has
/// settled for a few seconds. Stepping Blocked ↓ ↓ is sent as one change, nobody is notified about a colour you only
/// passed through, and landing back where you started sends nothing.
@MainActor
final class LightSender {
    private let teamStore: TeamStore
    private var sendTask: Task<Void, Never>?
    /// Your light as the team last saw it, before the change waiting to be sent.
    private var lightBeforeChange: Light?

    init(teamStore: TeamStore) {
        self.teamStore = teamStore
    }

    func pull(_ colour: Colour) {
        change { light in light.pulled(colour, atMilliseconds: Self.nowInMilliseconds) }
    }

    func step(_ direction: CycleDirection) {
        change { light in light.pulled(LightCycle.next(after: light.colour, direction), atMilliseconds: Self.nowInMilliseconds) }
    }

    /// Off hides you from everyone's menu bar; switching back on makes you Clear.
    func toggleOff() {
        change { light in light.pulled(light.colour == .off ? .green : .off, atMilliseconds: Self.nowInMilliseconds) }
    }

    func setStatus(_ status: String) {
        change { light in light.withStatus(status) }
    }

    /// Sends straight away, e.g. when the app quits mid-delay.
    func sendNow() {
        sendTask?.cancel()
        sendTask = nil
        guard let before = lightBeforeChange, let light = teamStore.yourLight else { return }
        lightBeforeChange = nil
        let isUnchanged = light.colour == before.colour && light.status == before.status
        if isUnchanged {
            teamStore.settleYourLight(showing: before)
            return
        }
        teamStore.settleYourLight(showing: nil)
        teamStore.send(.pull(light.colour, status: light.status))
    }

    private func change(_ transform: (Light) -> Light) {
        guard let light = teamStore.yourLight else { return }
        if lightBeforeChange == nil {
            lightBeforeChange = light
        }
        teamStore.showYourLight(transform(light))
        scheduleSend()
    }

    private func scheduleSend() {
        sendTask?.cancel()
        sendTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(AppConstants.lightSendDelaySeconds * 1_000_000_000))
            guard !Task.isCancelled else { return }
            self?.sendNow()
        }
    }

    private static var nowInMilliseconds: Double { Date().timeIntervalSince1970 * 1000 }
}
