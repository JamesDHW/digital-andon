import KeyboardShortcuts
import SwiftUI

/// One shortcut with a Remove button. The recorder's own ⓧ does not clear the shortcut, so this button does it.
/// A removed shortcut stays empty after a relaunch; it does not go back to its default.
struct ShortcutRow: View {
    let title: String
    let name: KeyboardShortcuts.Name

    var body: some View {
        HStack {
            KeyboardShortcuts.Recorder(title, name: name)
            Button("Remove") { KeyboardShortcuts.setShortcut(nil, for: name) }
                .help("Remove this shortcut so it does not clash with your other apps.")
        }
    }
}
