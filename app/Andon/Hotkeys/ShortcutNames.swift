import KeyboardShortcuts

/// The only shortcuts: ⌃⌥↑/↓ step your light up or down, ⌃⌥O switches you off and back on, ⌃⌥S sets your status.
extension KeyboardShortcuts.Name {
    static let cycleUp = Self("cycleUp", default: .init(.upArrow, modifiers: [.control, .option]))
    static let cycleDown = Self("cycleDown", default: .init(.downArrow, modifiers: [.control, .option]))
    static let toggleOff = Self("toggleOff", default: .init(.o, modifiers: [.control, .option]))
    static let editStatus = Self("editStatus", default: .init(.s, modifiers: [.control, .option]))
}
