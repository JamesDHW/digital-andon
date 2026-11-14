import AndonKit
import Foundation

/// The small grey line under a name: "Stop · 12 min · still waiting", "Watch · 1 h · no topic", "Clear · offline", "Off · 2 h".
enum MemberStatusText {
    static func describe(_ row: DropdownRow, now: Date) -> String {
        let light = row.rankedMember.light
        let elapsed = ElapsedTime.describe(sinceMilliseconds: light.since, now: now)
        let parts = [
            "\(LightNames.name(light.colour)) · \(elapsed)",
            light.isBreathing(at: now) ? "still waiting" : nil,
            light.colour == .amber && light.topic == nil ? "no topic" : nil,
            row.rankedMember.isOnline || light.colour == .off ? nil : "offline",
        ]
        return parts.compactMap { $0 }.joined(separator: " · ")
    }
}
