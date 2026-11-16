import Foundation

public enum Colour: String, Codable, CaseIterable, Sendable {
    case green
    case amber
    case red
    /// Not working right now: hidden from everyone's menu bar, including your own.
    case off

    /// The three working levels, in order, for pickers and cycling.
    public static let levels: [Colour] = [.green, .amber, .red]

    /// Amber and red ask for attention.
    public var isRaised: Bool { self == .amber || self == .red }

    public var isWorking: Bool { self != .off }

    /// Changing to Clear or Off ends a join, from either side; someone joined while Clear stays joined until they change.
    public var endsJoin: Bool { self == .green || self == .off }
}
