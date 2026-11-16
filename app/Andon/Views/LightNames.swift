import AndonKit

/// What each light means, in words: Clear, Disrupted and Blocked rather than colour names, and Off.
enum LightNames {
    static func name(_ colour: Colour) -> String {
        switch colour {
        case .green: return "Clear"
        case .amber: return "Disrupted"
        case .red: return "Blocked"
        case .off: return "Off"
        }
    }

    /// Shown on hover; the same sentences as the web app.
    static func description(_ colour: Colour) -> String {
        switch colour {
        case .green: return "Work is progressing as expected."
        case .amber: return "Work is progressing slower due to an unexpected complication."
        case .red: return "Work cannot continue without external attention."
        case .off: return "Not working right now: hidden from everyone's menu bar."
        }
    }
}
