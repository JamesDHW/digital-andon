import AndonKit
import Foundation

/// The small grey line under a name: "Blocked · 12 min · still waiting", "Blocked · 20 min · Tom is with them",
/// "Disrupted · 1 h", "Clear · offline", "Off · 2 h".
enum MemberStatusText {
    static func describe(_ row: DropdownRow, now: Date) -> String {
        let light = row.rankedMember.light
        let elapsed = ElapsedTime.describe(sinceMilliseconds: light.since, now: now)
        let helperNames = row.rankedMember.helpers.map(\.name)
        let parts = [
            "\(LightNames.name(light.colour)) · \(elapsed)",
            row.rankedMember.isBreathing(at: now) ? "still waiting" : nil,
            helperNames.isEmpty ? nil : "\(ListFormatter.localizedString(byJoining: helperNames)) \(helperNames.count == 1 ? "is" : "are") with them",
            row.rankedMember.isOnline || light.colour == .off ? nil : "offline",
        ]
        return parts.compactMap { $0 }.joined(separator: " · ")
    }
}
