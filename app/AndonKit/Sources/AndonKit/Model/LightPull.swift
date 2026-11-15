import Foundation

extension Light {
    /// The longest status the server keeps.
    public static let statusMaxLength = 140

    /// The same rule as the server's pullCord: a new colour starts a new period, and your status stays with you
    /// through amber, red and off but clears when you go back to green. Applied locally the moment you change your light.
    public func pulled(_ newColour: Colour, atMilliseconds now: Double) -> Light {
        if newColour == colour {
            return self
        }
        return Light(memberId: memberId, colour: newColour, status: newColour == .green ? nil : status, since: now)
    }

    /// A status can be set on any colour; blank clears it.
    public func withStatus(_ rawStatus: String) -> Light {
        Light(memberId: memberId, colour: colour, status: Self.normalisedStatus(rawStatus), since: since)
    }

    /// One short line, as the server stores it: whitespace collapsed, capped in length, blank meaning none.
    public static func normalisedStatus(_ rawStatus: String) -> String? {
        let singleLine = rawStatus.split(whereSeparator: \.isWhitespace).joined(separator: " ")
        guard !singleLine.isEmpty else { return nil }
        return String(singleLine.prefix(statusMaxLength))
    }
}
