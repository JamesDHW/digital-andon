import AndonKit
import AppKit

/// The marks in the status item: your squircle, a person's ringed avatar, and the placeholder.
enum LightShapes {
    /// A solid squircle, always: a change shows at once, even before it reaches the team.
    static func drawOwnLight(_ indicator: OwnLightIndicator, in rect: NSRect, rendering: LightRendering, alpha: CGFloat) {
        let colour = MenuBarPalette.fill(for: indicator.colour, rendering: rendering)
            .withAlphaComponent(alpha * breathingAlpha(isBreathing: indicator.isBreathing, rendering: rendering))
        colour.setFill()
        squircle(in: rect, inset: 0).fill()
    }

    /// The ring carries the colour; inside it, their photo or initial. Anything already drawn (the faces in
    /// `covering`, and your squircle if the face is behind it) is cut out, with a small transparent gap, so
    /// overlapping marks read as a stack.
    static func drawFace(_ face: MenuBarFace, covering: [NSRect], behindSquircle squircleRect: NSRect? = nil, photo: NSImage?, rendering: LightRendering, alpha: CGFloat) {
        let rect = face.rect
        let personAlpha = alpha * (face.isStale ? MenuBarLayout.staleAlpha : 1)
        NSGraphicsContext.saveGraphicsState()
        for coveringRect in covering {
            let cutout = coveringRect.insetBy(dx: -MenuBarLayout.overlapCutout, dy: -MenuBarLayout.overlapCutout)
            outsideClip(of: NSBezierPath(ovalIn: cutout), around: rect).addClip()
        }
        if let squircleRect {
            outsideClip(of: squircle(in: squircleRect, inset: -MenuBarLayout.overlapCutout), around: rect).addClip()
        }
        let ringAlpha = personAlpha * breathingAlpha(isBreathing: face.isBreathing, rendering: rendering)
        drawRing(in: rect, colour: MenuBarPalette.fill(for: face.colour, rendering: rendering).withAlphaComponent(ringAlpha))
        let photoRect = rect.insetBy(dx: MenuBarLayout.photoInset, dy: MenuBarLayout.photoInset)
        drawPhoto(of: face.member, photo: photo, in: photoRect, alpha: personAlpha)
        NSGraphicsContext.restoreGraphicsState()
    }

    /// Shown only when there is nothing else, so there is always something to click.
    static func drawPlaceholder(in rect: NSRect, isDarkMenuBar: Bool, alpha: CGFloat) {
        let inset = MenuBarLayout.placeholderLineWidth / 2
        let circle = NSBezierPath(ovalIn: rect.insetBy(dx: inset, dy: inset))
        circle.lineWidth = MenuBarLayout.placeholderLineWidth
        MenuBarPalette.placeholder(isDarkMenuBar: isDarkMenuBar).withAlphaComponent(alpha).setStroke()
        circle.stroke()
    }

    private static func breathingAlpha(isBreathing: Bool, rendering: LightRendering) -> CGFloat {
        guard isBreathing else { return 1 }
        return 1 - (1 - MenuBarLayout.breathingMinimumAlpha) * rendering.pulse
    }

    private static func squircle(in rect: NSRect, inset: CGFloat) -> NSBezierPath {
        let radius = MenuBarLayout.ownLightCornerRadius - inset
        return NSBezierPath(roundedRect: rect.insetBy(dx: inset, dy: inset), xRadius: radius, yRadius: radius)
    }

    private static func drawRing(in rect: NSRect, colour: NSColor) {
        let inset = MenuBarLayout.ringWidth / 2
        let ring = NSBezierPath(ovalIn: rect.insetBy(dx: inset, dy: inset))
        ring.lineWidth = MenuBarLayout.ringWidth
        colour.setStroke()
        ring.stroke()
    }

    private static func drawPhoto(of member: Member, photo: NSImage?, in rect: NSRect, alpha: CGFloat) {
        NSGraphicsContext.saveGraphicsState()
        NSBezierPath(ovalIn: rect).addClip()
        if let photo {
            photo.draw(in: aspectFill(photo.size, in: rect), from: .zero, operation: .sourceOver, fraction: alpha)
        }
        if photo == nil {
            drawInitial(of: member, in: rect, alpha: alpha)
        }
        NSGraphicsContext.restoreGraphicsState()
    }

    private static func drawInitial(of member: Member, in rect: NSRect, alpha: CGFloat) {
        MenuBarPalette.avatarBackground(for: member.id).withAlphaComponent(alpha).setFill()
        NSBezierPath(ovalIn: rect).fill()
        let attributes: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: rect.height * MenuBarLayout.initialFontScale, weight: .bold),
            .foregroundColor: NSColor.white.withAlphaComponent(alpha),
        ]
        let text = NSAttributedString(string: String(member.initials.prefix(1)), attributes: attributes)
        let size = text.size()
        text.draw(at: NSPoint(x: rect.midX - size.width / 2, y: rect.midY - size.height / 2))
    }

    /// Scales the photo to cover the circle, cropping the longer side.
    private static func aspectFill(_ imageSize: NSSize, in rect: NSRect) -> NSRect {
        guard imageSize.width > 0, imageSize.height > 0 else { return rect }
        let scale = max(rect.width / imageSize.width, rect.height / imageSize.height)
        let size = NSSize(width: imageSize.width * scale, height: imageSize.height * scale)
        return NSRect(x: rect.midX - size.width / 2, y: rect.midY - size.height / 2, width: size.width, height: size.height)
    }

    /// Everything around the face being drawn except the inside of the path, using the even-odd rule. The area is
    /// built around the face, not the cutout: a face further along than the cutout's surroundings would be sliced off.
    private static func outsideClip(of path: NSBezierPath, around faceRect: NSRect) -> NSBezierPath {
        let area = faceRect.union(path.bounds).insetBy(dx: -MenuBarLayout.height, dy: -MenuBarLayout.height)
        let clip = NSBezierPath(rect: area)
        clip.append(path)
        clip.windingRule = .evenOdd
        return clip
    }
}
