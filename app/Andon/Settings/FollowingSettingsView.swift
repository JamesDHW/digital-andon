import AndonKit
import SwiftUI

/// Who appears in your menu bar. Saved on the server, so it's the same on every Mac you use; nobody is told who follows them.
struct FollowingSettingsView: View {
    @ObservedObject var teamStore: TeamStore
    let actions: AndonActions

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("People you follow appear in your menu bar while they’re working, and you get a banner when they stop.")
                .font(.callout)
                .foregroundStyle(.secondary)
            if let state = teamStore.state {
                List(teammates(in: state)) { member in
                    Toggle(isOn: binding(for: member.id, in: state)) {
                        HStack {
                            AvatarView(member: member, colour: state.light(for: member.id)?.colour, diameter: 24)
                            Text(member.name)
                        }
                    }
                }
            }
        }
    }

    private func teammates(in state: TeamState) -> [Member] {
        state.members.values
            .filter { $0.id != state.you }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    private func binding(for memberID: MemberID, in state: TeamState) -> Binding<Bool> {
        Binding(
            get: { state.isFollowing(memberID) },
            set: { isFollowing in
                if isFollowing { return actions.follow(memberID) }
                actions.unfollow(memberID)
            }
        )
    }

}
