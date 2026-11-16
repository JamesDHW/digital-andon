import AndonKit
import KeyboardShortcuts
import SwiftUI

/// Everything has a shortcut that works from any app: stepping your light, switching off, your context, and joining someone.
struct ShortcutSettingsView: View {
    var body: some View {
        SettingsRow(label: "Step up (Clear → Disrupted → Blocked)") { KeyboardShortcuts.Recorder(for: .cycleUp) }
        SettingsRow(label: "Step down") { KeyboardShortcuts.Recorder(for: .cycleDown) }
        SettingsRow(label: "Switch off and back on") { KeyboardShortcuts.Recorder(for: .toggleOff) }
        SettingsRow(label: "Set your context") { KeyboardShortcuts.Recorder(for: .editStatus) }
        SettingsRow(label: "Join someone") { KeyboardShortcuts.Recorder(for: .joinSomeone) }
        Text("Locking your screen switches you off; unlocking puts your light back as it was.")
            .font(.caption)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)
    }
}
