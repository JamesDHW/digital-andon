import AndonKit
import SwiftUI

/// The menu bar dropdown: whoever is blocked first, then everyone else you follow, then your own light.
struct DropdownView: View {
    @ObservedObject var teamStore: TeamStore
    let actions: AndonActions

    @State private var isClearExpanded = false
    @State private var isOffExpanded = false
    @State private var isEveryoneElseExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ConnectionBanner(connection: teamStore.connection, problem: teamStore.lastProblem, onDismissProblem: teamStore.clearProblem, onSignIn: actions.openOnboarding)
            if let state = teamStore.state {
                TimelineView(.periodic(from: .now, by: AppConstants.elapsedTimeRefreshSeconds)) { timeline in
                    teamSections(DropdownModel.make(state: state), state: state, now: timeline.date)
                }
            }
            Divider()
            OwnLightControl(model: teamStore.state.map(DropdownModel.make(state:)) ?? .empty, actions: actions)
            Divider()
            footer
        }
        .frame(width: AppConstants.popoverWidth)
    }

    private func teamSections(_ model: DropdownModel, state: TeamState, now: Date) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 2) {
                DropdownHeader(blockedCount: model.red.count, state: state)
                DropdownSection(title: nil, rows: model.red, now: now, actions: actions)
                DropdownSection(title: "Assist · might need help", rows: model.amber, now: now, actions: actions)
                FoldedSection(title: "Clear", colour: .green, rows: model.green, now: now, actions: actions, isExpanded: $isClearExpanded)
                FoldedSection(title: "Off or offline", colour: nil, rows: model.off, now: now, actions: actions, isExpanded: $isOffExpanded)
                EveryoneElseRow(rows: model.everyoneElse, now: now, actions: actions, isExpanded: $isEveryoneElseExpanded)
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
            Spacer()
            Button("Settings…", action: actions.openSettings)
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
                SectionTitle(text: "Blocked, needs help · \(blockedCount)", colour: LightStyle.colour(.red))
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
    let now: Date
    let actions: AndonActions

    var body: some View {
        if !rows.isEmpty {
            if let title {
                SectionTitle(text: title).padding(.horizontal, 8).padding(.top, 10).padding(.bottom, 2)
            }
            ForEach(rows) { row in
                MemberRowView(row: row, now: now, actions: actions)
            }
        }
    }
}
