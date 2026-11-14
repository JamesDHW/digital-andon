import AndonKit

/// What each light means, in words: Clear, Watch and Stop rather than colour names, and Off.
enum LightNames {
    static func name(_ colour: Colour) -> String {
        switch colour {
        case .green: return "Clear"
        case .amber: return "Watch"
        case .red: return "Stop"
        case .off: return "Off"
        }
    }
}
