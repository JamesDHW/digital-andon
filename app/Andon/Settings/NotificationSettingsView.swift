import AndonKit
import SwiftUI

/// By default only a red earns a banner, with one reminder if they are still blocked. Banners go as soon as they leave red.
struct NotificationSettingsView: View {
    @ObservedObject var preferencesStore: PreferencesStore

    private static let reminderChoices = [0, 2, 5, 10, 15, 30]

    var body: some View {
        Form {
            Section {
                Toggle("Colours only – no banners or sounds", isOn: $preferencesStore.preferences.notifications.isColoursOnly)
            }
            Section("When someone you follow goes to…") {
                alertPicker("Blocked (red)", selection: $preferencesStore.preferences.notifications.red)
                alertPicker("Assist (amber)", selection: $preferencesStore.preferences.notifications.amber)
                alertPicker("Clear (green)", selection: $preferencesStore.preferences.notifications.green)
            }
            .disabled(preferencesStore.preferences.notifications.isColoursOnly)
            Section("Still blocked") {
                Picker("Remind me once after", selection: $preferencesStore.preferences.notifications.reminderMinutes) {
                    ForEach(Self.reminderChoices, id: \.self) { minutes in
                        Text(minutes == 0 ? "Never" : "\(minutes) minutes").tag(minutes)
                    }
                }
            }
            .disabled(preferencesStore.preferences.notifications.isColoursOnly)
            Text("Digital Andon also respects your Mac's Focus modes.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
    }

    private func alertPicker(_ title: String, selection: Binding<AlertStyle>) -> some View {
        Picker(title, selection: selection) {
            Text("Nothing").tag(AlertStyle.off)
            Text("Banner").tag(AlertStyle.banner)
            Text("Banner and sound").tag(AlertStyle.bannerAndSound)
        }
    }
}
