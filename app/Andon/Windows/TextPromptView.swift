import AndonKit
import SwiftUI

/// Spotlight-style: Enter submits (an empty answer still pulls the light, without a topic); Esc cancels.
struct TextPromptView: View {
    let prompt: TextPrompt
    let onSubmit: (String) -> Void
    let onCancel: () -> Void

    @State private var text: String
    @FocusState private var isFieldFocused: Bool

    init(prompt: TextPrompt, onSubmit: @escaping (String) -> Void, onCancel: @escaping () -> Void) {
        self.prompt = prompt
        self.onSubmit = onSubmit
        self.onCancel = onCancel
        _text = State(initialValue: prompt.initialText)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                OwnLightMark(colour: prompt.colour, side: 20)
                    .shadow(color: LightStyle.colour(prompt.colour).opacity(0.7), radius: 6)
                Text(prompt.title).font(.system(size: 15, weight: .semibold))
            }
            TextField(prompt.placeholder, text: $text)
                .textFieldStyle(.plain)
                .font(.system(size: 20))
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.primary.opacity(0.06)))
                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(Color.primary.opacity(0.14)))
                .focused($isFieldFocused)
                .onSubmit(submit)
            HStack {
                Text("Optional · Enter with nothing typed still works").foregroundStyle(.secondary)
                Spacer()
                KeyHint(key: "esc", action: "cancel")
                KeyHint(key: "↩", action: prompt.submitLabel)
            }
            .font(.system(size: 12))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 16)
        .frame(width: 600)
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

private struct KeyHint: View {
    let key: String
    let action: String

    var body: some View {
        HStack(spacing: 6) {
            Text(key)
                .font(.system(size: 11, design: .monospaced))
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(RoundedRectangle(cornerRadius: 5).fill(Color.primary.opacity(0.10)))
            Text(action).foregroundStyle(.secondary)
        }
    }
}
