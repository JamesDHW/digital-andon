import AndonKit
import SwiftUI

/// Who appears in your menu bar, from the person icon on the team page: everyone, people you follow first. Type to
/// filter. The order is set when the page opens, so a toggle never moves anyone. Follows are saved on the server, so
/// they're the same on every Mac you use, and nobody is told who follows them.
struct FollowingPage: View {
    @ObservedObject var teamStore: TeamStore
    let actions: AndonActions
    let onBack: () -> Void

    @State private var order: [MemberID] = []
    @State private var search = ""
    @FocusState private var isSearchFocused: Bool

    init(teamStore: TeamStore, actions: AndonActions, onBack: @escaping () -> Void) {
        self.teamStore = teamStore
        self.actions = actions
        self.onBack = onBack
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            Divider()
            searchField
            if let state = teamStore.state {
                list(state)
            }
            Divider()
            Text("People you follow appear in your menu bar while they're working.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
        }
        .onExitCommand(perform: onBack)
        .onAppear(perform: start)
    }

    private var header: some View {
        HStack(spacing: 6) {
            Button(action: onBack) {
                Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
            }
            .buttonStyle(.borderless)
            .help("Back")
            Text("Following").font(.system(size: 14, weight: .semibold))
            Spacer()
            if let state = teamStore.state {
                Text("\(state.follows.count) of \(max(state.members.count - 1, 0))")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    private var searchField: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Search people", text: $search)
                .textFieldStyle(.plain)
                .focused($isSearchFocused)
        }
        .font(.system(size: 13))
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(Color.primary.opacity(DropdownColours.trackOpacity)))
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
    }

    private func list(_ state: TeamState) -> some View {
        let shown = FollowingOrder.matching(FollowingOrder.keeping(order, in: state), search: search, in: state)
        return ScrollView {
            VStack(alignment: .leading, spacing: 2) {
                ForEach(shown.compactMap { state.members[$0] }) { member in
                    row(member, in: state)
                }
                if shown.isEmpty {
                    Text("Nobody matches “\(search)”.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .padding(8)
                }
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 8)
        }
        .frame(maxHeight: AppConstants.followingMaxHeight)
    }

    private func row(_ member: Member, in state: TeamState) -> some View {
        Toggle(isOn: binding(for: member.id, in: state)) {
            HStack(spacing: 10) {
                AvatarView(member: member, colour: state.light(for: member.id)?.colour, diameter: 26)
                Text(member.name).font(.system(size: 13))
            }
        }
        .toggleStyle(.switch)
        .controlSize(.mini)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
    }

    /// The order is taken once, when the page opens; the search field is ready to type into.
    private func start() {
        if let state = teamStore.state {
            order = FollowingOrder.initial(in: state)
        }
        DispatchQueue.main.async { isSearchFocused = true }
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
