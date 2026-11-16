import AndonKit
import AppKit

/// Lays out and draws the status item; StatusBitmap turns the drawing into the image the menu bar shows.
enum StatusImageRenderer {
    static func width(for model: MenuBarModel) -> CGFloat {
        if model.hasNothingToShow { return MenuBarLayout.placeholderDiameter + MenuBarLayout.edgeInset * 2 }
        let peopleWidth = MenuBarLayout.peopleWidth(count: model.people.count)
        return (peopleOriginX(for: model) + peopleWidth + MenuBarLayout.edgeInset).rounded(.up)
    }

    /// Your squircle first (unless you're off), then everyone working, red first; the first person sits on top.
    static func draw(_ model: MenuBarModel, rendering: LightRendering, photos: [MemberID: NSImage]) {
        let alpha = model.isDimmed ? MenuBarPalette.dimmedAlpha : 1
        if model.hasNothingToShow {
            return LightShapes.drawPlaceholder(in: centredSquare(side: MenuBarLayout.placeholderDiameter, x: MenuBarLayout.edgeInset), isDarkMenuBar: rendering.isDarkMenuBar, alpha: alpha)
        }
        if let ownLight = model.ownLight {
            LightShapes.drawOwnLight(ownLight, in: centredSquare(side: MenuBarLayout.ownLightSide, x: MenuBarLayout.edgeInset), rendering: rendering, alpha: alpha)
        }
        let rects = personRects(for: model)
        for (index, person) in model.people.enumerated() {
            LightShapes.drawPerson(person, in: rects[index], covering: Array(rects[..<index]), photo: photos[person.id], rendering: rendering, alpha: alpha)
        }
    }

    static func accessibilityDescription(for model: MenuBarModel) -> String {
        let ownPart = model.ownLight.map { "Your light: \(LightNames.name($0.colour))." } ?? "You're off."
        let peopleParts = model.people.map { person in
            let waiting = person.isBreathing ? ", waiting over 10 minutes" : ""
            return "\(person.member.name): \(LightNames.name(person.colour))\(waiting)."
        }
        return (["Digital Andon.", ownPart] + peopleParts).joined(separator: " ")
    }

    private static func peopleOriginX(for model: MenuBarModel) -> CGFloat {
        guard model.ownLight != nil else { return MenuBarLayout.edgeInset }
        return MenuBarLayout.edgeInset + MenuBarLayout.ownLightSide + MenuBarLayout.ownToPeopleGap
    }

    private static func personRects(for model: MenuBarModel) -> [NSRect] {
        let originX = peopleOriginX(for: model)
        let step = MenuBarLayout.avatarStep(count: model.people.count)
        return model.people.indices.map { index in
            centredSquare(side: MenuBarLayout.avatarDiameter, x: originX + CGFloat(index) * step)
        }
    }

    private static func centredSquare(side: CGFloat, x: CGFloat) -> NSRect {
        NSRect(x: x, y: (MenuBarLayout.height - side) / 2, width: side, height: side)
    }
}
