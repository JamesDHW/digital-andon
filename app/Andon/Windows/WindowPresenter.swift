import AppKit
import SwiftUI

/// Opens (or brings back) the Settings and onboarding windows. A menu bar app has no Dock icon, so it activates itself first.
@MainActor
final class WindowPresenter {
    private var windows: [String: NSWindow] = [:]

    func show<Content: View>(_ identifier: String, title: String, content: () -> Content) {
        NSApp.activate()
        if let existingWindow = windows[identifier] {
            return existingWindow.makeKeyAndOrderFront(nil)
        }
        let window = NSWindow(contentViewController: NSHostingController(rootView: content()))
        window.title = title
        window.styleMask = [.titled, .closable]
        window.isReleasedWhenClosed = false
        window.center()
        windows[identifier] = window
        window.makeKeyAndOrderFront(nil)
    }

    func close(_ identifier: String) {
        windows[identifier]?.close()
        windows[identifier] = nil
    }
}
