import Sparkle

/// Sparkle checks the appcast daily and offers updates. Without a feed URL (local builds) it stays off.
@MainActor
final class UpdaterController {
    let isConfigured: Bool
    private let controller: SPUStandardUpdaterController

    init(isConfigured: Bool) {
        self.isConfigured = isConfigured
        self.controller = SPUStandardUpdaterController(startingUpdater: isConfigured, updaterDelegate: nil, userDriverDelegate: nil)
    }

    func checkForUpdates() {
        guard isConfigured else { return }
        controller.checkForUpdates(nil)
    }
}
