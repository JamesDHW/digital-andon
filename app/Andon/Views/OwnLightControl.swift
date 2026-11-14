import AndonKit
import KeyboardShortcuts
import SwiftUI

/// Your own light: Clear, Watch and Stop with their shortcuts, an Off switch, then your topic.
struct OwnLightControl: View {
    let model: DropdownModel
    let pendingColour: Colour?
    let actions: AndonActions

    private var colour: Colour { pendingColour ?? model.yourLight?.colour ?? .green }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                SectionTitle(text: "Your light")
                Spacer()
                Text("Add ⇧ to include a topic").font(.system(size: 12)).foregroundStyle(.secondary)
            }
            HStack(spacing: 6) {
                ForEach(Colour.levels, id: \.self) { option in
                    colourButton(option)
                }
                offButton
            }
            .padding(4)
            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.primary.opacity(DropdownColours.trackOpacity)))
            status
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    @ViewBuilder
    private var status: some View {
        if let pendingColour {
            Text("\(LightStyle.name(pendingColour)) is sent \(Int(AppConstants.cycleSendDelaySeconds)) s after your last ⌃⌥↑/↓ press.")
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
        }
        if pendingColour == nil && colour == .off {
            Text("You're off: hidden from everyone's menu bar, and your own light is gone. Pick a light to start again.")
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        if pendingColour == nil && colour.isRaised {
            HStack(alignment: .firstTextBaseline) {
                Text(model.yourLight?.topic ?? "No topic").font(.callout).foregroundStyle(.secondary).lineLimit(2)
                Spacer()
                Button(model.yourLight?.topic == nil ? "Add topic…" : "Edit…", action: actions.editTopic).buttonStyle(.borderless)
            }
        }
    }

    private func colourButton(_ option: Colour) -> some View {
        segment(option, isSelected: option == colour) {
            VStack(spacing: 4) {
                HStack(spacing: 6) {
                    OwnLightMark(colour: option)
                    Text(LightStyle.name(option)).font(.system(size: 13, weight: .semibold))
                }
                Text(shortcutText(for: option))
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, minHeight: 44)
        }
    }

    /// Narrower than the three lights: it's a switch, not a signal.
    private var offButton: some View {
        segment(.off, isSelected: colour == .off) {
            VStack(spacing: 4) {
                OwnLightMark(colour: .off)
                Text(shortcutText(for: .off))
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            .frame(width: 52, height: 44)
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
        .help("\(LightStyle.name(option)) (\(shortcutText(for: option)))")
    }

    private func shortcutText(for option: Colour) -> String {
        let name: KeyboardShortcuts.Name
        switch option {
        case .green: name = .pullGreen
        case .amber: name = .pullAmber
        case .red: name = .pullRed
        case .off: name = .toggleOff
        }
        return KeyboardShortcuts.getShortcut(for: name)?.description ?? ""
    }
}
