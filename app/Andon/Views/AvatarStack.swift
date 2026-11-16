import AndonKit
import SwiftUI

/// A person's face with whoever has joined them tucked behind it, a little smaller, so it's clear
/// the problem is being looked at and by whom. Their face is on top.
struct AvatarStack: View {
    let member: Member
    let colour: Colour?
    let helpers: [Member]
    /// Each helper's own light, for their ring.
    let helperColour: (MemberID) -> Colour?
    var isBreathing = false
    var isDimmed = false
    var diameter: CGFloat = 34

    private var helperDiameter: CGFloat { (diameter * AppConstants.helperScale).rounded() }
    private var step: CGFloat { (helperDiameter * AppConstants.helperOverlap).rounded() }

    var body: some View {
        ZStack(alignment: .leading) {
            ForEach(Array(helpers.enumerated().reversed()), id: \.element.id) { index, helper in
                AvatarView(member: helper, colour: helperColour(helper.id), isDimmed: isDimmed, diameter: helperDiameter)
                    .background(Circle().fill(.background).padding(-1.5))
                    .offset(x: diameter - helperDiameter + step * CGFloat(index + 1))
            }
            AvatarView(member: member, colour: colour, isBreathing: isBreathing, isDimmed: isDimmed, diameter: diameter)
                .background(Circle().fill(.background).padding(helpers.isEmpty ? 0 : -1.5))
        }
        .frame(width: diameter + (helpers.isEmpty ? 0 : step * CGFloat(helpers.count)), height: diameter, alignment: .leading)
    }
}
