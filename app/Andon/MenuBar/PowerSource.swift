import Foundation
import IOKit.ps

/// Whether the Mac is on its charger, with a callback when that or Low Power Mode changes.
@MainActor
final class PowerSource {
    var onChange: (() -> Void)?
    private var runLoopSource: CFRunLoopSource?
    private var lowPowerObserver: NSObjectProtocol?

    init() {
        let context = Unmanaged.passUnretained(self).toOpaque()
        runLoopSource = IOPSNotificationCreateRunLoopSource({ context in
            guard let context else { return }
            let powerSource = Unmanaged<PowerSource>.fromOpaque(context).takeUnretainedValue()
            MainActor.assumeIsolated { powerSource.onChange?() }
        }, context)?.takeRetainedValue()
        if let runLoopSource {
            CFRunLoopAddSource(CFRunLoopGetMain(), runLoopSource, .defaultMode)
        }
        lowPowerObserver = NotificationCenter.default.addObserver(forName: .NSProcessInfoPowerStateDidChange, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.onChange?() }
        }
    }

    /// Brighter-than-white makes macOS run the backlight harder, so it is only worth it on the charger.
    var canAffordBoost: Bool {
        isOnCharger && !ProcessInfo.processInfo.isLowPowerModeEnabled
    }

    /// A Mac without a battery reports AC power, so desktops always count as plugged in.
    private var isOnCharger: Bool {
        guard let snapshot = IOPSCopyPowerSourcesInfo()?.takeRetainedValue(),
              let type = IOPSGetProvidingPowerSourceType(snapshot)?.takeUnretainedValue()
        else { return true }
        return (type as String) == kIOPMACPowerKey
    }
}
