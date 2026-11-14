import AndonKit
import SwiftUI

/// Name, photo and sign-out, plus app updates.
struct AccountSettingsView: View {
    @ObservedObject var accountController: AccountController
    @ObservedObject var teamStore: TeamStore
    let actions: AndonActions
    let updater: UpdaterController

    var body: some View {
        Form {
            if let state = teamStore.state, let yourself = state.yourself {
                Section("Profile") {
                    ProfileEditor(accountController: accountController, member: yourself)
                }
            }
            Section("This Mac") {
                LabeledContent("Server", value: accountController.session?.server.host ?? "Not signed in")
                LabeledContent("Device", value: accountController.deviceName)
                if accountController.session == nil {
                    Button("Join a team…", action: actions.openOnboarding)
                }
                if accountController.session != nil {
                    Button("Sign out of this Mac", role: .destructive, action: accountController.signOut)
                }
            }
            Section("Updates") {
                Button("Check for updates…", action: updater.checkForUpdates)
                    .disabled(!updater.isConfigured)
            }
        }
        .formStyle(.grouped)
    }
}
