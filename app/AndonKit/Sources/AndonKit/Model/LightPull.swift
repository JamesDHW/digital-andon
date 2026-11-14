import Foundation

extension Light {
    /// The same rule as the server's pullCord: a new colour starts a new period; the same colour only updates the topic.
    /// Green and off never carry a topic. The app applies it immediately so the menu bar changes the moment a key is pressed.
    public func pulled(_ newColour: Colour, topic newTopic: String?, atMilliseconds now: Double) -> Light {
        let isSameColour = newColour == colour
        if !newColour.isRaised {
            return isSameColour ? self : Light(memberId: memberId, colour: newColour, topic: nil, since: now)
        }
        if isSameColour {
            return Light(memberId: memberId, colour: colour, topic: newTopic ?? topic, since: since)
        }
        return Light(memberId: memberId, colour: newColour, topic: newTopic, since: now)
    }
}
