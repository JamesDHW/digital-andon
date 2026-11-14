import KeyboardShortcuts

/// Defaults: ⌃⌥G/A/R pull instantly; add ⇧ to pull amber or red with a topic; ⌃⌥↑/↓ step up or down (sent after a pause);
/// ⌃⌥O switches you off (hidden from everyone) and back on.
extension KeyboardShortcuts.Name {
    static let pullGreen = Self("pullGreen", default: .init(.g, modifiers: [.control, .option]))
    static let pullAmber = Self("pullAmber", default: .init(.a, modifiers: [.control, .option]))
    static let pullRed = Self("pullRed", default: .init(.r, modifiers: [.control, .option]))
    static let pullAmberWithTopic = Self("pullAmberWithTopic", default: .init(.a, modifiers: [.control, .option, .shift]))
    static let pullRedWithTopic = Self("pullRedWithTopic", default: .init(.r, modifiers: [.control, .option, .shift]))
    static let cycleUp = Self("cycleUp", default: .init(.upArrow, modifiers: [.control, .option]))
    static let cycleDown = Self("cycleDown", default: .init(.downArrow, modifiers: [.control, .option]))
    static let toggleOff = Self("toggleOff", default: .init(.o, modifiers: [.control, .option]))
}
