import AndonKit
import Foundation

/// The small grey line under a name: "Blocked · 12 min · still waiting", "Assist · 1 h", "Clear · offline", "Off · 2 h".
enum MemberStatusText {
    static func describe(_ row: DropdownRow, now: Date) -> String {
        let light = row.rankedMember.light
        let elapsed = ElapsedTime.describe(sinceMilliseconds: light.since, now: now)
        let parts = [
            "\(LightNames.name(light.colour)) · \(elapsed)",
            light.isBreathing(at: now) ? "still waiting" : nil,
            row.rankedMember.isOnline || light.colour == .off ? nil : "offline",
        ]
        return parts.compactMap { $0 }.joined(separator: " · ")
    }
}
