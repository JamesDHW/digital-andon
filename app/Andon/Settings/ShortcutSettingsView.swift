import AndonKit
import KeyboardShortcuts
import SwiftUI

/// Shortcuts work from any app. The plain ones pull instantly; the ⇧ ones ask for a topic first.
struct ShortcutSettingsView: View {
    @ObservedObject var preferencesStore: PreferencesStore

    var body: some View {
        Form {
            Section("Pull instantly") {
                KeyboardShortcuts.Recorder("Clear (green):", name: .pullGreen)
                KeyboardShortcuts.Recorder("Watch (amber):", name: .pullAmber)
                KeyboardShortcuts.Recorder("Stop (red):", name: .pullRed)
            }
            Section("Pull with a topic") {
                KeyboardShortcuts.Recorder("Watch with topic:", name: .pullAmberWithTopic)
                KeyboardShortcuts.Recorder("Stop with topic:", name: .pullRedWithTopic)
            }
            Section("Step up or down (sent \(Int(AppConstants.cycleSendDelaySeconds)) s after the last press)") {
                KeyboardShortcuts.Recorder("Step up (Clear → Watch → Stop → Clear):", name: .cycleUp)
                KeyboardShortcuts.Recorder("Step down (Stop → Watch → Clear → Stop):", name: .cycleDown)
            }
            Section("Off") {
                KeyboardShortcuts.Recorder("Switch off and back on:", name: .toggleOff)
                Text("Off hides you from everyone's menu bar, and your own light disappears from yours.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Section("Prompts") {
                Toggle("Ask what unblocked me when I go clear", isOn: $preferencesStore.preferences.prompts.asksForResolutionNote)
            }
        }
        .formStyle(.grouped)
    }
}
