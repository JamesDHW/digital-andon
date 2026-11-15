import AndonKit

/// What each light means, in words: Clear, Assist and Blocked rather than colour names, and Off.
enum LightNames {
    static func name(_ colour: Colour) -> String {
        switch colour {
        case .green: return "Clear"
        case .amber: return "Assist"
        case .red: return "Blocked"
        case .off: return "Off"
        }
    }
}
