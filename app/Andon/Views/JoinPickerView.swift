import AndonKit
import SwiftUI

/// ⌃⌥J unless exactly one person is Disrupted or Blocked: everyone working, most urgent first and already selected.
/// ↑↓ to choose, ↩ to join (or leave, if you're already with them), or click.
struct JoinPickerView: View {
    let state: TeamState
    let now: Date
    let onChoose: (MemberID) -> Void
    let onCancel: () -> Void

    @State private var selection = 0
    @FocusState private var isFocused: Bool

    init(state: TeamState, now: Date, onChoose: @escaping (MemberID) -> Void, onCancel: @escaping () -> Void) {
        self.state = state
        self.now = now
        self.onChoose = onChoose
        self.onCancel = onCancel
    }

    private var candidates: [RankedMember] { Ranking.joinable(in: state) }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                SectionTitle(text: "Join someone")
                Spacer()
                HStack(spacing: 10) {
                    KeyHint(key: "↑↓", action: "choose")
                    KeyHint(key: "↩", action: "join")
                    KeyHint(key: "esc", action: "cancel")
                }
                .font(.system(size: 11))
            }
            .padding(.horizontal, 8)
            if candidates.isEmpty {
                Text("Nobody else is working right now.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .padding(8)
            }
            ScrollViewReader { scroller in
                ScrollView {
                    VStack(spacing: 2) {
                        ForEach(Array(candidates.enumerated()), id: \.element.id) { index, candidate in
                            row(candidate, isSelected: index == clampedSelection)
                                .id(candidate.id)
                                .onTapGesture { onChoose(candidate.id) }
                        }
                    }
                }
                .frame(maxHeight: AppConstants.joinPickerMaxHeight)
                .onChange(of: clampedSelection) { _, index in
                    guard candidates.indices.contains(index) else { return }
                    scroller.scrollTo(candidates[index].id)
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 10)
        .focusable()
        .focusEffectDisabled()
        .focused($isFocused)
        .onKeyPress(.upArrow) { move(by: -1) }
        .onKeyPress(.downArrow) { move(by: 1) }
        .onKeyPress(.return) { chooseSelected() }
        .onExitCommand(perform: onCancel)
        .onAppear { DispatchQueue.main.async { isFocused = true } }
    }

    private var clampedSelection: Int { min(max(selection, 0), max(candidates.count - 1, 0)) }

    private func move(by offset: Int) -> KeyPress.Result {
        guard !candidates.isEmpty else { return .ignored }
        selection = min(max(clampedSelection + offset, 0), candidates.count - 1)
        return .handled
    }

    private func chooseSelected() -> KeyPress.Result {
        guard candidates.indices.contains(clampedSelection) else { return .ignored }
        onChoose(candidates[clampedSelection].id)
        return .handled
    }

    private func row(_ candidate: RankedMember, isSelected: Bool) -> some View {
        HStack(spacing: 12) {
            AvatarStack(
                member: candidate.member,
                colour: candidate.light.colour,
                helpers: candidate.helpers,
                helperColour: { state.light(for: $0)?.colour },
                isBreathing: candidate.isBreathing(at: now),
                diameter: 32
            )
            VStack(alignment: .leading, spacing: 1) {
                Text(candidate.member.name).font(.system(size: 14, weight: .semibold))
                Text(candidate.light.status ?? LightStyle.name(candidate.light.colour))
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer()
            if state.youAreHelping == candidate.id {
                Text("With you · ↩ leaves").font(.system(size: 11)).foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(isSelected ? Color.accentColor.opacity(0.18) : Color.clear)
        )
        .contentShape(Rectangle())
    }
}
