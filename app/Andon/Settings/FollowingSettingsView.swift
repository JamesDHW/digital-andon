import AndonKit
import SwiftUI

/// Who appears in your menu bar. Saved on the server, so it's the same on every Mac you use; nobody is told who follows them.
struct FollowingSettingsView: View {
    let state: TeamState
    let actions: AndonActions

    var body: some View {
        ForEach(teammates) { member in
            Toggle(isOn: binding(for: member.id)) {
                HStack(spacing: 8) {
                    AvatarView(member: member, colour: state.light(for: member.id)?.colour, diameter: 22)
                    Text(member.name).font(.system(size: 13))
                }
            }
            .toggleStyle(.switch)
            .controlSize(.mini)
        }
        Text("People you follow appear in your menu bar while they're working.")
            .font(.caption)
            .foregroundStyle(.secondary)
    }

    private var teammates: [Member] {
        state.members.values
            .filter { $0.id != state.you }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    private func binding(for memberID: MemberID) -> Binding<Bool> {
        Binding(
            get: { state.isFollowing(memberID) },
            set: { isFollowing in
                if isFollowing { return actions.follow(memberID) }
                actions.unfollow(memberID)
            }
        )
    }
}
