import AndonKit
import AppKit

/// One circle in the status item. Faces are drawn in order, each tucked behind everything drawn before it.
struct MenuBarFace {
    let member: Member
    let colour: Colour
    let isBreathing: Bool
    let isStale: Bool
    let rect: NSRect
}

/// Lays out and draws the status item; StatusBitmap turns the drawing into the image the menu bar shows.
enum StatusImageRenderer {
    static func width(for model: MenuBarModel) -> CGFloat {
        if model.hasNothingToShow { return MenuBarLayout.placeholderDiameter + MenuBarLayout.edgeInset * 2 }
        let facesEnd = faces(for: model).map(\.rect.maxX).max() ?? peopleOriginX(for: model)
        let ownLightEnd = model.ownLight == nil ? 0 : MenuBarLayout.edgeInset + MenuBarLayout.ownLightSide
        return (max(facesEnd, ownLightEnd) + MenuBarLayout.edgeInset).rounded(.up)
    }

    /// Your squircle first (unless you're off), then everyone working, red first, each with whoever has joined them
    /// tucked behind; the first person sits on top.
    static func draw(_ model: MenuBarModel, rendering: LightRendering, photos: [MemberID: NSImage]) {
        let alpha = model.isDimmed ? MenuBarPalette.dimmedAlpha : 1
        if model.hasNothingToShow {
            return LightShapes.drawPlaceholder(in: centredSquare(side: MenuBarLayout.placeholderDiameter, x: MenuBarLayout.edgeInset), isDarkMenuBar: rendering.isDarkMenuBar, alpha: alpha)
        }
        if let ownLight = model.ownLight {
            LightShapes.drawOwnLight(ownLight, in: centredSquare(side: MenuBarLayout.ownLightSide, x: MenuBarLayout.edgeInset), rendering: rendering, alpha: alpha)
        }
        let faces = faces(for: model)
        for (index, face) in faces.enumerated() {
            LightShapes.drawFace(face, covering: faces[..<index].map(\.rect), photo: photos[face.member.id], rendering: rendering, alpha: alpha)
        }
    }

    /// Everyone whose photo the status item shows, helpers included.
    static func members(in model: MenuBarModel) -> [Member] {
        model.people.flatMap { [$0.member] + $0.helpers.map(\.member) }
    }

    static func accessibilityDescription(for model: MenuBarModel) -> String {
        let ownPart = model.ownLight.map { "Your status: \(LightNames.name($0.colour))." } ?? "You're off."
        let peopleParts = model.people.map { person in
            let waiting = person.isBreathing ? ", waiting over 10 minutes" : ""
            let helpers = person.helpers.isEmpty ? "" : ", with \(ListFormatter.localizedString(byJoining: person.helpers.map(\.member.name)))"
            return "\(person.member.name): \(LightNames.name(person.colour))\(waiting)\(helpers)."
        }
        return (["Digital Andon.", ownPart] + peopleParts).joined(separator: " ")
    }

    /// Each person's face, then their helpers' smaller faces peeking out to the right of it.
    static func faces(for model: MenuBarModel) -> [MenuBarFace] {
        let isSeparate = model.people.count <= MenuBarLayout.maximumSeparateAvatars
        let advances = model.people.map { MenuBarLayout.groupAdvance(helperCount: $0.helpers.count, isSeparate: isSeparate) }
        let originX = peopleOriginX(for: model)
        let starts = advances.indices.map { index in originX + advances[..<index].reduce(0, +) }
        return zip(model.people, starts).flatMap { person, x in
            let face = MenuBarFace(
                member: person.member, colour: person.colour, isBreathing: person.isBreathing, isStale: person.isStale,
                rect: centredSquare(side: MenuBarLayout.avatarDiameter, x: x)
            )
            let helperFaces = person.helpers.enumerated().map { index, helper in
                MenuBarFace(
                    member: helper.member, colour: helper.colour, isBreathing: false, isStale: person.isStale,
                    rect: centredSquare(side: MenuBarLayout.helperDiameter, x: x + MenuBarLayout.helperOffset(index: index))
                )
            }
            return [face] + helperFaces
        }
    }

    private static func peopleOriginX(for model: MenuBarModel) -> CGFloat {
        guard model.ownLight != nil else { return MenuBarLayout.edgeInset }
        return MenuBarLayout.edgeInset + MenuBarLayout.ownLightSide + MenuBarLayout.ownToPeopleGap
    }

    private static func centredSquare(side: CGFloat, x: CGFloat) -> NSRect {
        NSRect(x: x, y: (MenuBarLayout.height - side) / 2, width: side, height: side)
    }
}
