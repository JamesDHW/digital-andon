import AndonKit
import SwiftUI

/// By default only a red earns a banner, with one reminder if they are still blocked. Banners go as soon as they leave red.
struct NotificationSettingsView: View {
    @ObservedObject var preferencesStore: PreferencesStore

    private static let reminderChoices = [0, 2, 5, 10, 15, 30]

    private var isColoursOnly: Bool { preferencesStore.preferences.notifications.isColoursOnly }

    var body: some View {
        Toggle("Colours only – no banners or sounds", isOn: $preferencesStore.preferences.notifications.isColoursOnly)
            .font(.system(size: 13))
        Group {
            alertPicker(.red, selection: $preferencesStore.preferences.notifications.red)
            alertPicker(.amber, selection: $preferencesStore.preferences.notifications.amber)
            alertPicker(.green, selection: $preferencesStore.preferences.notifications.green)
            SettingsRow(label: "If still blocked, remind me after") {
                Picker("", selection: $preferencesStore.preferences.notifications.reminderMinutes) {
                    ForEach(Self.reminderChoices, id: \.self) { minutes in
                        Text(minutes == 0 ? "Never" : "\(minutes) min").tag(minutes)
                    }
                }
                .labelsHidden()
                .fixedSize()
            }
        }
        .disabled(isColoursOnly)
        Text("When someone you follow changes light. Digital Andon also respects your Mac's Focus modes.")
            .font(.caption)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func alertPicker(_ colour: Colour, selection: Binding<AlertStyle>) -> some View {
        SettingsRow(label: LightNames.name(colour)) {
            Picker("", selection: selection) {
                Text("Nothing").tag(AlertStyle.off)
                Text("Banner").tag(AlertStyle.banner)
                Text("Banner and sound").tag(AlertStyle.bannerAndSound)
            }
            .labelsHidden()
            .fixedSize()
        }
        .help(LightNames.description(colour))
    }
}
