import AppKit
import SwiftUI

/// A Spotlight-style non-activating panel: it takes the keyboard without switching apps, so focus returns where it was.
@MainActor
final class TextPromptPresenter: NSObject, NSWindowDelegate {
    private var panel: NSPanel?

    func present(_ prompt: TextPrompt, onSubmit: @escaping (String) -> Void) {
        dismiss()
        let view = TextPromptView(
            prompt: prompt,
            onSubmit: { [weak self] text in
                self?.dismiss()
                onSubmit(text)
            },
            onCancel: { [weak self] in self?.dismiss() }
        )
        let hostingController = NSHostingController(rootView: view)
        let panel = KeyablePanel(
            contentRect: NSRect(origin: .zero, size: hostingController.view.fittingSize),
            styleMask: [.titled, .fullSizeContentView, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.contentViewController = hostingController
        panel.titleVisibility = .hidden
        panel.titlebarAppearsTransparent = true
        panel.isMovableByWindowBackground = true
        panel.level = .floating
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.becomesKeyOnlyIfNeeded = false
        panel.delegate = self
        panel.center()
        self.panel = panel
        panel.makeKeyAndOrderFront(nil)
    }

    func dismiss() {
        panel?.delegate = nil
        panel?.close()
        panel = nil
    }

    /// Clicking away cancels, like Spotlight.
    func windowDidResignKey(_ notification: Notification) {
        dismiss()
    }
}

private final class KeyablePanel: NSPanel {
    override var canBecomeKey: Bool { true }
}
