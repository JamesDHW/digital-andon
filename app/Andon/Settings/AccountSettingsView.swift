import AndonKit
import SwiftUI

/// Who you are, as your team sees you: your Google photo, email and name. Only the name can be changed.
struct AccountSettingsView: View {
    @ObservedObject var accountController: AccountController
    @ObservedObject var teamStore: TeamStore
    let actions: AndonActions
    let updater: UpdaterController

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if let yourself = teamStore.state?.yourself {
                ProfileEditor(accountController: accountController, member: yourself)
            }
            if accountController.session != nil && teamStore.state?.yourself == nil {
                ProgressView("Connecting…")
            }
            if accountController.session == nil {
                Text("You're not signed in on this Mac.").foregroundStyle(.secondary)
            }
            Spacer()
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
        }
        .padding(8)
    }
}
