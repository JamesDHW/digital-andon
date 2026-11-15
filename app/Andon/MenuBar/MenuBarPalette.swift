import AndonKit
import AppKit

/// How to colour one frame of the status item.
struct LightRendering {
    /// Above 1 lifts amber and red past white on XDR displays (extended dynamic range).
    let brightness: CGFloat
    /// 0…1; drives the breathing of a red that has waited ten minutes or more.
    let pulse: CGFloat
    let isDarkMenuBar: Bool
}

/// Signal colours, as Display P3 so they are wider than sRGB. Light menu bars get deeper shades to hold contrast.
enum MenuBarPalette {
    static let dimmedAlpha: CGFloat = 0.35
    /// Display P3 is gamma-encoded (≈2.2), so a linear brightness boost is applied as its 1/2.2 power.
    private static let displayGamma: CGFloat = 2.2
    /// XDR screens report up to 16× headroom, but often can't deliver it at the current brightness and clip
    /// instead. Asking for at most this much keeps the boost within what they actually show.
    private static let maximumBoost: CGFloat = 3
    /// Channels at least this strong carry the colour and are lifted; weaker ones keep their normal value.
    private static let strongChannel: CGFloat = 0.5
    private static let avatarBackgrounds: [RGB] = [
        RGB(0.36, 0.29, 0.84), RGB(0.18, 0.49, 0.55), RGB(0.66, 0.34, 0.18),
        RGB(0.29, 0.42, 0.18), RGB(0.55, 0.25, 0.45), RGB(0.22, 0.36, 0.62),
    ]

    /// Amber and red are as bright as the screen allows; green stays at normal brightness so "all fine" never shouts.
    static func fill(for colour: Colour, rendering: LightRendering) -> NSColor {
        let components = signal(colour, isDarkMenuBar: rendering.isDarkMenuBar)
        guard colour.isRaised else { return displayP3(components) }
        return boosted(components, brightness: rendering.brightness)
    }

    static func placeholder(isDarkMenuBar: Bool) -> NSColor {
        isDarkMenuBar ? NSColor(white: 1, alpha: 0.5) : NSColor(white: 0, alpha: 0.45)
    }

    /// For SwiftUI: follows the window's light or dark appearance.
    static func adaptive(_ colour: Colour) -> NSColor {
        NSColor(name: nil) { appearance in
            let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
            return displayP3(signal(colour, isDarkMenuBar: isDark))
        }
    }

    /// Behind someone's initial when they have no photo; picked from their id so it never changes.
    static func avatarBackground(for memberID: MemberID) -> NSColor {
        let index = memberID.rawValue.unicodeScalars.reduce(0) { total, scalar in total + Int(scalar.value) }
        return displayP3(avatarBackgrounds[index % avatarBackgrounds.count])
    }

    private static func signal(_ colour: Colour, isDarkMenuBar: Bool) -> RGB {
        switch (colour, isDarkMenuBar) {
        case (.green, true): return RGB(0.188, 0.820, 0.345)
        case (.amber, true): return RGB(1.0, 0.698, 0.141)
        case (.red, true): return RGB(1.0, 0.231, 0.188)
        case (.off, true): return RGB(0.557, 0.557, 0.576)
        case (.green, false): return RGB(0.122, 0.616, 0.263)
        case (.amber, false): return RGB(0.851, 0.541, 0.0)
        case (.red, false): return RGB(0.878, 0.145, 0.106)
        case (.off, false): return RGB(0.557, 0.557, 0.576)
        }
    }

    private static func displayP3(_ components: RGB) -> NSColor {
        NSColor(displayP3Red: components.red, green: components.green, blue: components.blue, alpha: 1)
    }

    /// Components above 1 are only meaningful in an extended colour space; they mean "brighter than white".
    /// Only a colour's strong channels are lifted. Lifting all three made red wash out to peach wherever the
    /// screen clipped the red channel and let green and blue keep rising; this way a clipped red is still red.
    private static func boosted(_ components: RGB, brightness: CGFloat) -> NSColor {
        guard brightness > 1, let extendedSpace = CGColorSpace(name: CGColorSpace.extendedDisplayP3).flatMap(NSColorSpace.init(cgColorSpace:)) else {
            return displayP3(components)
        }
        let encodedBoost = pow(min(brightness, maximumBoost), 1 / displayGamma)
        let lift = { (component: CGFloat) in component >= strongChannel ? component * encodedBoost : component }
        let boostedComponents = [lift(components.red), lift(components.green), lift(components.blue), 1]
        return NSColor(colorSpace: extendedSpace, components: boostedComponents, count: boostedComponents.count)
    }
}

private struct RGB {
    let red: CGFloat
    let green: CGFloat
    let blue: CGFloat

    init(_ red: CGFloat, _ green: CGFloat, _ blue: CGFloat) {
        self.red = red
        self.green = green
        self.blue = blue
    }
}
