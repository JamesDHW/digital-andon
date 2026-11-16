import AndonKit
import SwiftUI

/// The menu bar's signal colours for SwiftUI, following the window's light or dark appearance.
enum LightStyle {
    static func colour(_ colour: Colour) -> Color { Color(nsColor: MenuBarPalette.adaptive(colour)) }

    static func name(_ colour: Colour) -> String { LightNames.name(colour) }

    static func description(_ colour: Colour) -> String { LightNames.description(colour) }
}

/// A small solid light.
struct LightDot: View {
    let colour: Colour
    var diameter: CGFloat = 12

    var body: some View {
        Circle()
            .fill(LightStyle.colour(colour))
            .frame(width: diameter, height: diameter)
    }
}

/// Your own light, as in the menu bar: a squircle. Off is drawn as an empty outline.
struct OwnLightMark: View {
    let colour: Colour
    var side: CGFloat = 10

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: side * 0.32, style: .continuous)
        if colour.isWorking {
            shape.fill(LightStyle.colour(colour)).frame(width: side, height: side)
        }
        if !colour.isWorking {
            shape.strokeBorder(Color.secondary, lineWidth: max(1, side * 0.12)).frame(width: side, height: side)
        }
    }
}

/// Slowly fades a view in and out: a red that has waited ten minutes, as in the menu bar.
struct Breathing: ViewModifier {
    let isActive: Bool

    @ViewBuilder
    func body(content: Content) -> some View {
        if isActive {
            content.phaseAnimator([false, true]) { view, isFaded in
                view.opacity(isFaded ? 0.35 : 1)
            } animation: { _ in
                .easeInOut(duration: AppConstants.pulsePeriodSeconds / 2)
            }
        }
        if !isActive {
            content
        }
    }
}
