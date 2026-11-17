import AndonKit
import SwiftUI

/// Bright colours: on XDR screens, Disrupted and Blocked glow brighter than white while the Mac is plugged in.
/// It makes macOS run the backlight harder, so it's never used on battery or in Low Power Mode, and can be turned off.
struct DisplaySettingsView: View {
    @ObservedObject var preferencesStore: PreferencesStore

    var body: some View {
        Toggle("Bright colours", isOn: $preferencesStore.preferences.isBrightColours)
            .font(.system(size: 13))
        Text("On XDR screens, Disrupted and Blocked glow brighter than white while your Mac is plugged in. Off, they use the screen's normal brightness.")
            .font(.caption)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)
    }
}
