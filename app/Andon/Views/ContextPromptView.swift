import AndonKit
import SwiftUI

/// One line of context beside your light, typed straight into the popover. Enter sets it (empty clears it); Esc cancels.
struct ContextPromptView: View {
    let colour: Colour
    let onSubmit: (String) -> Void
    let onCancel: () -> Void

    @State private var text: String
    @FocusState private var isFieldFocused: Bool

    init(colour: Colour, current: String?, onSubmit: @escaping (String) -> Void, onCancel: @escaping () -> Void) {
        self.colour = colour
        self.onSubmit = onSubmit
        self.onCancel = onCancel
        _text = State(initialValue: current ?? "")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                OwnLightMark(colour: colour, side: 18)
                    .shadow(color: LightStyle.colour(colour).opacity(0.7), radius: 5)
                    .help(LightStyle.name(colour))
                TextField("Set a context to show", text: $text)
                    .textFieldStyle(.plain)
                    .font(.system(size: 16))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(RoundedRectangle(cornerRadius: 9, style: .continuous).fill(Color.primary.opacity(0.06)))
                    .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).strokeBorder(Color.primary.opacity(0.14)))
                    .focused($isFieldFocused)
                    .onSubmit(submit)
            }
            HStack(spacing: 10) {
                Text("Context history is retained in Digital Andon").foregroundStyle(.secondary)
                Spacer()
                KeyHint(key: "esc", action: "cancel")
                KeyHint(key: "↩", action: "set")
            }
            .font(.system(size: 11))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .onExitCommand(perform: onCancel)
        .onAppear(perform: focusField)
    }

    private func submit() {
        onSubmit(text)
    }

    private func focusField() {
        DispatchQueue.main.async { isFieldFocused = true }
    }
}

struct KeyHint: View {
    let key: String
    let action: String

    var body: some View {
        HStack(spacing: 5) {
            Text(key)
                .font(.system(size: 10, design: .monospaced))
                .padding(.horizontal, 5)
                .padding(.vertical, 1)
                .background(RoundedRectangle(cornerRadius: 4).fill(Color.primary.opacity(0.10)))
            Text(action).foregroundStyle(.secondary)
        }
    }
}
