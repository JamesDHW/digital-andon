import AndonKit
import SwiftUI

struct SettingsView: View {
    @ObservedObject var accountController: AccountController
    @ObservedObject var teamStore: TeamStore
    @ObservedObject var preferencesStore: PreferencesStore
    let actions: AndonActions
    let updater: UpdaterController

    var body: some View {
        TabView {
            AccountSettingsView(accountController: accountController, teamStore: teamStore, actions: actions, updater: updater)
                .tabItem { Label("Account", systemImage: "person.crop.circle") }
            FollowingSettingsView(teamStore: teamStore, actions: actions)
                .tabItem { Label("Following", systemImage: "person.2") }
            NotificationSettingsView(preferencesStore: preferencesStore)
                .tabItem { Label("Notifications", systemImage: "bell") }
            ShortcutSettingsView(preferencesStore: preferencesStore)
                .tabItem { Label("Shortcuts", systemImage: "keyboard") }
        }
        .frame(width: 480, height: 420)
        .padding(20)
    }
}
