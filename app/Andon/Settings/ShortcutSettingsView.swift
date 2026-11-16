import AndonKit
import KeyboardShortcuts
import SwiftUI

/// Three things have shortcuts, and they work from any app: stepping your light, switching off, and your status.
struct ShortcutSettingsView: View {
    var body: some View {
        Form {
            Section("Your light") {
                KeyboardShortcuts.Recorder("Step up (Clear → Assist → Blocked):", name: .cycleUp)
                KeyboardShortcuts.Recorder("Step down (Blocked → Assist → Clear):", name: .cycleDown)
            }
            Section("Off") {
                KeyboardShortcuts.Recorder("Switch off and back on:", name: .toggleOff)
                Text("Off hides you from everyone's menu bar, and your own light disappears from yours.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Section("Status") {
                KeyboardShortcuts.Recorder("Set your status:", name: .editStatus)
                Text("One line saying what you're doing. It stays until you change it or go back to Clear.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
    }
}
