import AndonKit

/// A one-line question: the topic for Watch or Stop, or what unblocked you.
struct TextPrompt: Equatable {
    let colour: Colour
    let title: String
    let placeholder: String
    let initialText: String
    let submitLabel: String

    static func topic(for colour: Colour, current: String?) -> TextPrompt {
        TextPrompt(
            colour: colour,
            title: colour == .red ? "Stop — what's blocked you?" : "Watch — what might you need help with?",
            placeholder: colour == .red ? "Prod deploy blocked by a failing migration" : "Unsure about the API shape for exports",
            initialText: current ?? "",
            submitLabel: colour == .red ? "pull red" : "pull amber"
        )
    }

    static let resolutionNote = TextPrompt(
        colour: .green,
        title: "Clear again — what unblocked you?",
        placeholder: "Paired with Tom on the migration",
        initialText: "",
        submitLabel: "save note"
    )
}
