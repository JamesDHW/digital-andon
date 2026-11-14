import AndonKit
import AppKit

/// Renders the status item into a half-float bitmap in extended Display P3, so fill values above 1 survive
/// and an XDR display can show them brighter than white. Only used when the screen has headroom.
enum HighDynamicRangeImage {
    private static let bitsPerHalfFloat = 16

    static func make(for model: MenuBarModel, rendering: LightRendering, photos: [MemberID: NSImage], backingScale: CGFloat) -> NSImage? {
        let size = NSSize(width: StatusImageRenderer.width(for: model), height: MenuBarLayout.height)
        let pixelWidth = Int((size.width * backingScale).rounded(.up))
        let pixelHeight = Int((size.height * backingScale).rounded(.up))
        guard let colourSpace = CGColorSpace(name: CGColorSpace.extendedDisplayP3) else { return nil }
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.floatComponents.rawValue | CGBitmapInfo.byteOrder16Little.rawValue
        guard let context = CGContext(
            data: nil, width: pixelWidth, height: pixelHeight, bitsPerComponent: bitsPerHalfFloat, bytesPerRow: 0,
            space: colourSpace, bitmapInfo: bitmapInfo
        ) else { return nil }

        context.scaleBy(x: backingScale, y: backingScale)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
        StatusImageRenderer.draw(model, rendering: rendering, photos: photos)
        NSGraphicsContext.restoreGraphicsState()

        guard let cgImage = context.makeImage() else { return nil }
        let image = NSImage(cgImage: cgImage, size: size)
        image.isTemplate = false
        return image
    }

    /// How much brighter than white this screen can go (1 means no extended range).
    static func headroom(of screen: NSScreen?) -> CGFloat {
        screen?.maximumPotentialExtendedDynamicRangeColorComponentValue ?? 1
    }
}

/// Shows the high dynamic range image inside the status item button, without taking its clicks.
final class HighDynamicRangeImageView: NSImageView {
    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        preferredImageDynamicRange = .high
        imageScaling = .scaleNone
        imageAlignment = .alignCenter
        autoresizingMask = [.width, .height]
    }

    required init?(coder: NSCoder) {
        nil
    }

    override func hitTest(_ point: NSPoint) -> NSView? {
        nil
    }
}
