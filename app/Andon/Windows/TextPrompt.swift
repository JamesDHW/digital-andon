import AndonKit

/// A one-line question, shown Spotlight-style: today only your status.
struct TextPrompt: Equatable {
    let colour: Colour
    let title: String
    let placeholder: String
    let initialText: String
    let submitLabel: String

    static func status(colour: Colour, current: String?) -> TextPrompt {
        TextPrompt(
            colour: colour,
            title: "What are you doing?",
            placeholder: colour == .red ? "Prod deploy blocked by a failing migration" : "Pairing with Tom on the export API",
            initialText: current ?? "",
            submitLabel: "set status"
        )
    }
}
