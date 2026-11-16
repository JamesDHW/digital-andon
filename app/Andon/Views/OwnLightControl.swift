import AndonKit
import SwiftUI

/// Your own status: Clear, Disrupted and Blocked, an Off switch, who you're with, then your context. Changes show at once.
struct OwnLightControl: View {
    let state: TeamState?
    let actions: AndonActions

    private var yourLight: Light? { state.flatMap { $0.light(for: $0.you) } }
    private var colour: Colour { yourLight?.colour ?? .green }
    private var context: String? { yourLight?.status }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionTitle(text: "Your status")
            HStack(spacing: 6) {
                ForEach(Colour.levels, id: \.self) { option in
                    colourButton(option)
                }
                offButton
            }
            .padding(4)
            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.primary.opacity(DropdownColours.trackOpacity)))
            if colour == .off {
                Text("You're off: hidden from everyone's menu bar, and your own light is gone. Pick a light to start again.")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            joinRow
            contextRow
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    /// Who you've joined, or who has joined you.
    @ViewBuilder
    private var joinRow: some View {
        if let state, let helpingID = state.youAreHelping, let person = state.members[helpingID] {
            HStack {
                Label("With \(person.name)", systemImage: "person.2.fill").font(.callout)
                Spacer()
                Button("Leave", action: actions.leave)
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .help("Your light goes back to what it was before you joined")
            }
        }
        if let state, !state.helpers(of: state.you).isEmpty {
            let names = state.helpers(of: state.you).map(\.name)
            Label("\(ListFormatter.localizedString(byJoining: names)) \(names.count == 1 ? "is" : "are") with you", systemImage: "person.2.fill")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
    }

    private var contextRow: some View {
        HStack(alignment: .center) {
            Text(context ?? "No context")
                .font(.callout)
                .foregroundStyle(context == nil ? Color.secondary : Color.primary)
                .lineLimit(2)
            Spacer()
            Button(context == nil ? "Set context…" : "Change…", action: actions.editContextFromDropdown)
                .buttonStyle(.bordered)
                .controlSize(.small)
        }
    }

    private func colourButton(_ option: Colour) -> some View {
        segment(option, isSelected: option == colour) {
            HStack(spacing: 6) {
                OwnLightMark(colour: option)
                Text(LightStyle.name(option)).font(.system(size: 13, weight: .semibold))
            }
            .frame(maxWidth: .infinity, minHeight: 36)
        }
    }

    /// Narrower than the three lights: it's a switch, not a signal.
    private var offButton: some View {
        segment(.off, isSelected: colour == .off) {
            OwnLightMark(colour: .off).frame(width: 44, height: 36)
        }
    }

    private func segment<Label: View>(_ option: Colour, isSelected: Bool, @ViewBuilder label: () -> Label) -> some View {
        Button { actions.pull(option) } label: {
            label()
                .background(
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .fill(isSelected ? LightStyle.colour(option).opacity(DropdownColours.selectedLightOpacity) : Color.clear)
                )
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(LightStyle.name(option)))
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        .help(LightStyle.description(option))
    }
}
