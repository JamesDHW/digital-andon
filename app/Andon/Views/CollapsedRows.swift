import AndonKit
import SwiftUI

/// A group folded into one line of small marks until you open it: everyone Clear, or everyone Off.
struct FoldedSection: View {
    let title: String
    /// Nil draws grey marks, for people who are off or offline.
    let colour: Colour?
    let rows: [DropdownRow]
    let now: Date
    let actions: AndonActions
    @Binding var isExpanded: Bool

    var body: some View {
        if !rows.isEmpty {
            DisclosureRow(isExpanded: $isExpanded) {
                Text(title).font(.system(size: 13, weight: .semibold))
                HStack(spacing: 4) {
                    ForEach(rows.prefix(12)) { _ in mark }
                }
                Text("\(rows.count)").font(.system(size: 12)).foregroundStyle(.secondary)
            } content: {
                ForEach(rows) { row in
                    MemberRowView(row: row, now: now, actions: actions)
                }
            }
        }
    }

    @ViewBuilder
    private var mark: some View {
        if let colour {
            LightDot(colour: colour, diameter: 8)
        }
        if colour == nil {
            Circle().strokeBorder(Color.secondary.opacity(0.7), lineWidth: 1.2).frame(width: 8, height: 8)
        }
    }
}

struct EveryoneElseRow: View {
    let rows: [DropdownRow]
    let now: Date
    let actions: AndonActions
    @Binding var isExpanded: Bool

    var body: some View {
        if !rows.isEmpty {
            DisclosureRow(isExpanded: $isExpanded) {
                Text("Everyone else").font(.system(size: 13, weight: .semibold))
                Text("\(rows.count) you don't follow").font(.system(size: 12)).foregroundStyle(.secondary)
            } content: {
                ForEach(rows) { row in
                    MemberRowView(row: row, now: now, actions: actions)
                }
            }
        }
    }
}

/// A full-width chevron row that reveals its content below.
struct DisclosureRow<Label: View, Content: View>: View {
    @Binding var isExpanded: Bool
    @ViewBuilder let label: () -> Label
    @ViewBuilder let content: () -> Content

    var body: some View {
        Button { isExpanded.toggle() } label: {
            HStack(spacing: 10) {
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .rotationEffect(.degrees(isExpanded ? 90 : 0))
                label()
                Spacer()
            }
            .padding(.horizontal, 8)
            .frame(minHeight: 36)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        if isExpanded {
            content()
        }
    }
}
