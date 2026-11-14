import AndonKit
import KeyboardShortcuts

/// Global shortcuts work from any app; they only need registering once.
@MainActor
enum HotkeyController {
    static func register(_ actions: AndonActions) {
        KeyboardShortcuts.onKeyUp(for: .pullGreen) { [weak actions] in actions?.pull(.green) }
        KeyboardShortcuts.onKeyUp(for: .pullAmber) { [weak actions] in actions?.pull(.amber) }
        KeyboardShortcuts.onKeyUp(for: .pullRed) { [weak actions] in actions?.pull(.red) }
        KeyboardShortcuts.onKeyUp(for: .pullAmberWithTopic) { [weak actions] in actions?.pullWithTopic(.amber) }
        KeyboardShortcuts.onKeyUp(for: .pullRedWithTopic) { [weak actions] in actions?.pullWithTopic(.red) }
        KeyboardShortcuts.onKeyDown(for: .cycleUp) { [weak actions] in actions?.cycle(.up) }
        KeyboardShortcuts.onKeyDown(for: .cycleDown) { [weak actions] in actions?.cycle(.down) }
        KeyboardShortcuts.onKeyUp(for: .toggleOff) { [weak actions] in actions?.toggleOff() }
    }
}
