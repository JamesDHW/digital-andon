import AndonKit
import SwiftUI

/// The person's photo (or initials on a colour picked from their id) inside a thick ring in their light's colour,
/// the same picture as in the menu bar. Off has no ring.
struct AvatarView: View {
    let member: Member
    let colour: Colour?
    var isBreathing = false
    var isDimmed = false
    var diameter: CGFloat = 34

    private var ringColour: Colour? { colour.flatMap { $0.isWorking ? $0 : nil } }
    private var ringWidth: CGFloat { max(2, diameter * 0.1) }
    private var photoDiameter: CGFloat { ringColour == nil ? diameter : diameter - (ringWidth + 1.5) * 2 }

    var body: some View {
        ZStack {
            if let ringColour {
                Circle()
                    .strokeBorder(LightStyle.colour(ringColour), lineWidth: ringWidth)
                    .modifier(Breathing(isActive: isBreathing))
            }
            photo
                .frame(width: photoDiameter, height: photoDiameter)
                .clipShape(Circle())
        }
        .frame(width: diameter, height: diameter)
        .opacity(isDimmed ? 0.45 : 1)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(accessibilityText))
    }

    private var accessibilityText: String {
        guard let colour else { return member.name }
        return "\(member.name), \(LightStyle.name(colour))"
    }

    @ViewBuilder
    private var photo: some View {
        if let avatarUrl = member.avatarUrl {
            AsyncImage(url: avatarUrl) { phase in
                if let image = phase.image {
                    image.resizable().scaledToFill()
                } else {
                    initials
                }
            }
        } else {
            initials
        }
    }

    private var initials: some View {
        ZStack {
            Circle().fill(Color(nsColor: MenuBarPalette.avatarBackground(for: member.id)))
            Text(member.initials)
                .font(.system(size: photoDiameter * 0.38, weight: .semibold))
                .foregroundStyle(.white)
        }
    }
}
