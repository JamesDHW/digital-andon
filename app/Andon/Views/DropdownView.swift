import AndonKit
import SwiftUI

/// The menu bar popover. Usually the team: whoever is blocked first, then everyone else you follow, then your own
/// status. It also shows your context, the join picker and settings in place, so everything hangs from the icon.
struct DropdownView: View {
    @ObservedObject var teamStore: TeamStore
    @ObservedObject var navigation: DropdownNavigation
    @ObservedObject var accountController: AccountController
    @ObservedObject var preferencesStore: PreferencesStore
    let actions: AndonActions
    let updater: UpdaterController

    @State private var isClearExpanded = false
    @State private var isOffExpanded = false
    @State private var isEveryoneElseExpanded = false

    var body: some View {
        page.frame(width: AppConstants.popoverWidth)
    }

    @ViewBuilder
    private var page: some View {
        switch navigation.page {
        case .team:
            teamPage
        case let .context(returnsToTeam):
            ContextPromptView(
                colour: teamStore.yourLight?.colour ?? .green,
                current: teamStore.yourLight?.status,
                onSubmit: actions.setContext,
                onCancel: {
                    if returnsToTeam { return navigation.page = .team }
                    actions.closeDropdown()
                }
            )
        case .join:
            if let state = teamStore.state {
                JoinPickerView(state: state, now: Date(), onChoose: actions.chooseFromJoinPicker, onCancel: actions.closeDropdown)
            }
        case .following:
            FollowingPage(teamStore: teamStore, actions: actions, onBack: { navigation.page = .team })
        case .settings:
            SettingsPage(
                accountController: accountController,
                teamStore: teamStore,
                preferencesStore: preferencesStore,
                actions: actions,
                updater: updater,
                onBack: { navigation.page = .team }
            )
        }
    }

    private var teamPage: some View {
        VStack(alignment: .leading, spacing: 0) {
            ConnectionBanner(connection: teamStore.connection, problem: teamStore.lastProblem, onDismissProblem: teamStore.clearProblem, onSignIn: actions.openOnboarding)
            if let state = teamStore.state {
                TimelineView(.periodic(from: .now, by: AppConstants.elapsedTimeRefreshSeconds)) { timeline in
                    teamSections(DropdownModel.make(state: state), state: state, now: timeline.date)
                }
            }
            Divider()
            OwnLightControl(state: teamStore.state, actions: actions)
            Divider()
            footer
        }
    }

    private func teamSections(_ model: DropdownModel, state: TeamState, now: Date) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 2) {
                DropdownHeader(blockedCount: model.red.count, state: state)
                DropdownSection(title: nil, rows: model.red, state: state, now: now, actions: actions)
                DropdownSection(title: "Disrupted", rows: model.amber, state: state, now: now, actions: actions)
                FoldedSection(title: "Clear", colour: .green, rows: model.green, state: state, now: now, actions: actions, isExpanded: $isClearExpanded)
                FoldedSection(title: "Off or offline", colour: nil, rows: model.off, state: state, now: now, actions: actions, isExpanded: $isOffExpanded)
                EveryoneElseRow(rows: model.everyoneElse, state: state, now: now, actions: actions, isExpanded: $isEveryoneElseExpanded)
                if state.follows.isEmpty {
                    Text("You're not following anyone yet. Follow people from “Everyone else”.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .padding(8)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 10)
        }
        .frame(maxHeight: 480)
    }

    private var footer: some View {
        HStack {
            Button { navigation.page = .settings } label: {
                Label("Settings", systemImage: "gearshape")
            }
            Button { navigation.page = .following } label: {
                Label("Following", systemImage: "person.2")
            }
            .help("Choose who appears in your menu bar")
            Spacer()
            Button("Quit", action: actions.quit)
        }
        .buttonStyle(.borderless)
        .font(.system(size: 13))
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}

struct DropdownHeader: View {
    let blockedCount: Int
    let state: TeamState

    var body: some View {
        HStack {
            if blockedCount > 0 {
                SectionTitle(text: "Blocked · \(blockedCount)", colour: LightStyle.colour(.red))
                    .help(LightNames.description(.red))
            }
            if blockedCount == 0 {
                SectionTitle(text: "Nobody is blocked", colour: .secondary)
            }
            Spacer()
            Text("\(state.follows.count) followed · \(state.follows.filter(state.online.contains).count) online")
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 4)
    }
}

struct SectionTitle: View {
    let text: String
    var colour: Color = .secondary

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 11, weight: .semibold))
            .tracking(0.6)
            .foregroundStyle(colour)
    }
}

struct DropdownSection: View {
    let title: String?
    let rows: [DropdownRow]
    let state: TeamState
    let now: Date
    let actions: AndonActions

    var body: some View {
        if !rows.isEmpty {
            if let title {
                SectionTitle(text: title).padding(.horizontal, 8).padding(.top, 10).padding(.bottom, 2)
                    .help(LightNames.description(.amber))
            }
            ForEach(rows) { row in
                MemberRowView(row: row, state: state, now: now, actions: actions)
            }
        }
    }
}
