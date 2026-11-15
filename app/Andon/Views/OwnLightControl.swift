import AndonKit
import SwiftUI

/// Your own light: Clear, Assist and Blocked, an Off switch, then your status. Changes show at once.
struct OwnLightControl: View {
    let model: DropdownModel
    let actions: AndonActions

    private var colour: Colour { model.yourLight?.colour ?? .green }
    private var status: String? { model.yourLight?.status }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionTitle(text: "Your light")
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
            statusRow
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var statusRow: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(status ?? "No status")
                .font(.callout)
                .foregroundStyle(status == nil ? Color.secondary : Color.primary)
                .lineLimit(2)
            Spacer()
            Button(status == nil ? "Set status…" : "Change…", action: actions.editStatus).buttonStyle(.borderless)
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
        .help(LightStyle.name(option))
    }
}
