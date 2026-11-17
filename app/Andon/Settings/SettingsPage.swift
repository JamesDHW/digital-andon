import AndonKit
import SwiftUI

/// Settings, inside the popover: you, the display, notifications and shortcuts, then updates and signing out.
/// Who you follow has its own page, from the person icon on the team page.
struct SettingsPage: View {
    @ObservedObject var accountController: AccountController
    @ObservedObject var teamStore: TeamStore
    @ObservedObject var preferencesStore: PreferencesStore
    let actions: AndonActions
    let updater: UpdaterController
    let onBack: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            Divider()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    account
                    SettingsSection(title: "Display") {
                        DisplaySettingsView(preferencesStore: preferencesStore)
                    }
                    SettingsSection(title: "Notifications") {
                        NotificationSettingsView(preferencesStore: preferencesStore)
                    }
                    SettingsSection(title: "Shortcuts") {
                        ShortcutSettingsView()
                    }
                }
                .padding(16)
            }
            .frame(maxHeight: AppConstants.settingsMaxHeight)
            Divider()
            footer
        }
        .onExitCommand(perform: onBack)
    }

    private var header: some View {
        HStack(spacing: 6) {
            Button(action: onBack) {
                Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
            }
            .buttonStyle(.borderless)
            .help("Back")
            Text("Settings").font(.system(size: 14, weight: .semibold))
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    @ViewBuilder
    private var account: some View {
        if let yourself = teamStore.state?.yourself {
            ProfileEditor(accountController: accountController, member: yourself)
        }
        if accountController.session != nil && teamStore.state?.yourself == nil {
            ProgressView("Connecting…").controlSize(.small)
        }
        if accountController.session == nil {
            Text("You're not signed in on this Mac.").foregroundStyle(.secondary)
        }
    }

    private var footer: some View {
        HStack {
            Button("Check for Updates…", action: updater.checkForUpdates)
                .disabled(!updater.isConfigured)
            Spacer()
            if accountController.session != nil {
                Button("Sign Out", role: .destructive, action: accountController.signOut)
            }
            if accountController.session == nil {
                Button("Sign In…", action: actions.openOnboarding)
            }
        }
        .controlSize(.small)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }
}

/// A titled group on the settings page, on the same soft track as your light's buttons.
struct SettingsSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            SectionTitle(text: title)
            VStack(alignment: .leading, spacing: 8) {
                content()
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.primary.opacity(DropdownColours.trackOpacity)))
        }
    }
}

/// A label on the left and its control on the right, in the settings page.
struct SettingsRow<Control: View>: View {
    let label: String
    @ViewBuilder let control: () -> Control

    var body: some View {
        HStack {
            Text(label).font(.system(size: 13))
            Spacer(minLength: 8)
            control()
        }
    }
}
