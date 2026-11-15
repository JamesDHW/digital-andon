import AndonKit
import KeyboardShortcuts

/// Global shortcuts work from any app; they only need registering once.
@MainActor
enum HotkeyController {
    static func register(_ actions: AndonActions) {
        KeyboardShortcuts.onKeyDown(for: .cycleUp) { [weak actions] in actions?.cycle(.up) }
        KeyboardShortcuts.onKeyDown(for: .cycleDown) { [weak actions] in actions?.cycle(.down) }
        KeyboardShortcuts.onKeyUp(for: .toggleOff) { [weak actions] in actions?.toggleOff() }
        KeyboardShortcuts.onKeyUp(for: .editStatus) { [weak actions] in actions?.editStatus() }
    }
}
