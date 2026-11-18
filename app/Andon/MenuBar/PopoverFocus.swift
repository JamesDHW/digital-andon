import AppKit

/// Gives focus back to the app you were in when the popover closes, so a shortcut like ⌃⌥S never strands you, except
/// when it closes to make way for one of Digital Andon's own windows (updates, sign-in), which must stay in front.
@MainActor
final class PopoverFocus {
    private var previousApp: NSRunningApplication?
    private var isHandingOverToOwnWindow = false

    func popoverWillOpen() {
        let frontmost = NSWorkspace.shared.frontmostApplication
        previousApp = frontmost == NSRunningApplication.current ? nil : frontmost
    }

    func handOverToOwnWindow() {
        isHandingOverToOwnWindow = true
    }

    /// Closed with Esc or ↩ (so the app is still active, rather than you having clicked another app), focus goes back.
    func popoverDidClose() {
        if NSApp.isActive && !isHandingOverToOwnWindow {
            previousApp?.activate()
        }
        previousApp = nil
        isHandingOverToOwnWindow = false
    }
}
