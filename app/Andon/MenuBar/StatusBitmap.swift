import AndonKit
import AppKit

/// Draws the status item into a bitmap at the screen's scale. A boosted bitmap is half-float extended Display P3,
/// so fill values above 1 survive and an XDR display can show them brighter than white.
enum StatusBitmap {
    private static let bitsPerHalfFloat = 16
    private static let bitsPerByte = 8

    static func make(for model: MenuBarModel, rendering: LightRendering, photos: [MemberID: NSImage], backingScale: CGFloat) -> CGImage? {
        let isBoosted = rendering.brightness > 1
        let size = NSSize(width: StatusImageRenderer.width(for: model), height: MenuBarLayout.height)
        let pixelWidth = Int((size.width * backingScale).rounded(.up))
        let pixelHeight = Int((size.height * backingScale).rounded(.up))
        let colourSpaceName = isBoosted ? CGColorSpace.extendedDisplayP3 : CGColorSpace.displayP3
        guard let colourSpace = CGColorSpace(name: colourSpaceName) else { return nil }
        let halfFloatInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.floatComponents.rawValue | CGBitmapInfo.byteOrder16Little.rawValue
        let bitmapInfo = isBoosted ? halfFloatInfo : CGImageAlphaInfo.premultipliedLast.rawValue
        guard let context = CGContext(
            data: nil, width: pixelWidth, height: pixelHeight, bitsPerComponent: isBoosted ? bitsPerHalfFloat : bitsPerByte, bytesPerRow: 0,
            space: colourSpace, bitmapInfo: bitmapInfo
        ) else { return nil }

        context.scaleBy(x: backingScale, y: backingScale)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
        StatusImageRenderer.draw(model, rendering: rendering, photos: photos)
        NSGraphicsContext.restoreGraphicsState()
        return context.makeImage()
    }

    /// How much brighter than white this screen can go (1 means no extended range).
    static func headroom(of screen: NSScreen?) -> CGFloat {
        screen?.maximumPotentialExtendedDynamicRangeColorComponentValue ?? 1
    }
}

/// Shows the status item inside its button, without taking its clicks. Breathing is a Core Animation cross-fade
/// between two pre-drawn frames, run by the system compositor, so the app itself does no work while it breathes.
final class StatusImageView: NSView {
    private static let breathingKey = "breathing"

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        wantsLayer = true
        layerContentsRedrawPolicy = .never
        layer?.contentsGravity = .center
        autoresizingMask = [.width, .height]
    }

    required init?(coder: NSCoder) {
        nil
    }

    /// The layer's contents are set directly in `show`, so AppKit has nothing to draw.
    override var wantsUpdateLayer: Bool { true }

    override func updateLayer() {}

    override func hitTest(_ point: NSPoint) -> NSView? {
        nil
    }

    /// With a `dimmed` frame, fades to it and back every pulse period until the next call.
    func show(_ image: CGImage, dimmed: CGImage?, scale: CGFloat, isBoosted: Bool) {
        guard let layer else { return }
        layer.removeAnimation(forKey: Self.breathingKey)
        layer.contentsScale = scale
        layer.wantsExtendedDynamicRangeContent = isBoosted
        layer.contents = image
        guard let dimmed else { return }
        let fade = CABasicAnimation(keyPath: "contents")
        fade.fromValue = image
        fade.toValue = dimmed
        fade.duration = AppConstants.pulsePeriodSeconds / 2
        fade.autoreverses = true
        fade.repeatCount = .infinity
        fade.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        layer.add(fade, forKey: Self.breathingKey)
    }
}
