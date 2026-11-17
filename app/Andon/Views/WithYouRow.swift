import AndonKit
import SwiftUI

/// Who is with you right now, with their faces and how long since the first of them joined: "James is with you · 12 min".
/// They're left out of your people list, so this is where you see them. Only they can leave; going Clear ends it too.
struct WithYouRow: View {
    let state: TeamState

    private var helpers: [Member] { state.helpers(of: state.you) }
    /// A helper's light changes when they join, so the earliest of those is when help arrived.
    private var joinedAt: Double? { helpers.compactMap { state.light(for: $0.id)?.since }.min() }

    var body: some View {
        TimelineView(.periodic(from: .now, by: AppConstants.elapsedTimeRefreshSeconds)) { timeline in
            HStack(spacing: 8) {
                faces
                Text(description(now: timeline.date))
                    .font(.callout)
                    .lineLimit(2)
                Spacer(minLength: 0)
            }
        }
    }

    private var faces: some View {
        HStack(spacing: -6) {
            ForEach(helpers) { helper in
                AvatarView(member: helper, colour: state.light(for: helper.id)?.colour, diameter: 24)
                    .background(Circle().fill(.background).padding(-1.5))
            }
        }
    }

    private func description(now: Date) -> String {
        let names = ListFormatter.localizedString(byJoining: helpers.map(\.name))
        let verb = helpers.count == 1 ? "is" : "are"
        guard let joinedAt else { return "\(names) \(verb) with you" }
        return "\(names) \(verb) with you · \(ElapsedTime.describe(sinceMilliseconds: joinedAt, now: now))"
    }
}
