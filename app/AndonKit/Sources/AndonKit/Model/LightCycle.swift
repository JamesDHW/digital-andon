import Foundation

public enum CycleDirection: Sendable {
    /// Clear → Disrupted → Blocked → Clear.
    case up
    /// Blocked → Disrupted → Clear → Blocked.
    case down
}

/// Stepping your light with the arrow shortcuts. Both ends wrap, so any level is at most two presses away.
/// Cycling while off switches you back on, stepping from Clear.
public enum LightCycle {
    public static func next(after colour: Colour, _ direction: CycleDirection) -> Colour {
        switch (colour, direction) {
        case (.green, .up), (.off, .up): return .amber
        case (.amber, .up): return .red
        case (.red, .up): return .green
        case (.green, .down), (.off, .down): return .red
        case (.amber, .down): return .green
        case (.red, .down): return .amber
        }
    }
}
