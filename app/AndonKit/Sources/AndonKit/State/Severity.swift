import Foundation

/// The order lights are shown in: who needs help first.
public enum Severity: Int, Comparable, Sendable {
    case red
    case amber
    case green
    case off

    public init(of light: Light) {
        switch light.colour {
        case .red: self = .red
        case .amber: self = .amber
        case .green: self = .green
        case .off: self = .off
        }
    }

    public static func < (lhs: Severity, rhs: Severity) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}
