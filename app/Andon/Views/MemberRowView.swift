import AndonKit
import SwiftUI

/// One person. Someone blocked gets a tinted card, so it's the first thing you see; go and help them.
struct MemberRowView: View {
    let row: DropdownRow
    let now: Date
    let actions: AndonActions

    private var member: Member { row.rankedMember.member }
    private var light: Light { row.rankedMember.light }
    private var isBlocked: Bool { light.colour == .red }

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            AvatarView(
                member: member,
                colour: light.colour,
                isBreathing: light.isBreathing(at: now),
                isDimmed: !row.rankedMember.isOnline || light.colour == .off,
                diameter: isBlocked ? 40 : 34
            )
            VStack(alignment: .leading, spacing: 2) {
                Text(member.name).font(.system(size: 14, weight: .semibold))
                if let status = light.status {
                    Text(status).font(.system(size: 13)).foregroundStyle(.primary.opacity(0.85)).lineLimit(2)
                }
                Text(MemberStatusText.describe(row, now: now)).font(.system(size: 12)).foregroundStyle(.secondary)
            }
            Spacer(minLength: 4)
            if !row.isFollowed {
                Button("Follow") { actions.follow(member.id) }.controlSize(.small)
            }
        }
        .padding(.vertical, isBlocked ? 12 : 7)
        .padding(.horizontal, isBlocked ? 12 : 8)
        .background(cardBackground)
        .contentShape(Rectangle())
        .contextMenu { contextMenu }
    }

    @ViewBuilder
    private var cardBackground: some View {
        if isBlocked {
            RoundedRectangle(cornerRadius: 12, style: .continuous).fill(LightStyle.colour(.red).opacity(DropdownColours.blockedCardOpacity))
        }
    }

    @ViewBuilder
    private var contextMenu: some View {
        if row.isFollowed {
            Button("Unfollow \(member.name)") { actions.unfollow(member.id) }
        }
        if !row.isFollowed {
            Button("Follow \(member.name)") { actions.follow(member.id) }
        }
    }
}
