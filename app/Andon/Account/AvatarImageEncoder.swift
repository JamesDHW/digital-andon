import AndonKit
import AppKit

enum AvatarImageEncoder {
    /// Reads any image file and returns a square-bounded PNG no larger than maxDimension on its longest side.
    static func pngData(from fileURL: URL, maxDimension: CGFloat) -> Result<Data, AndonError> {
        guard let image = NSImage(contentsOf: fileURL), image.size.width > 0, image.size.height > 0 else {
            return .failure(AndonError(.invalidInput, "That file isn't an image Andon can read."))
        }
        let scale = min(1, maxDimension / max(image.size.width, image.size.height))
        let targetSize = NSSize(width: (image.size.width * scale).rounded(), height: (image.size.height * scale).rounded())
        guard let bitmap = NSBitmapImageRep(
            bitmapDataPlanes: nil, pixelsWide: Int(targetSize.width), pixelsHigh: Int(targetSize.height),
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
        ) else {
            return .failure(AndonError(.unexpected, "Couldn't prepare the image."))
        }
        draw(image, into: bitmap, size: targetSize)
        guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
            return .failure(AndonError(.unexpected, "Couldn't convert the image to PNG."))
        }
        return .success(pngData)
    }

    private static func draw(_ image: NSImage, into bitmap: NSBitmapImageRep, size: NSSize) {
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
        image.draw(in: NSRect(origin: .zero, size: size), from: .zero, operation: .copy, fraction: 1)
        NSGraphicsContext.restoreGraphicsState()
    }
}
