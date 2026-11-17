import AndonKit
import SwiftUI

/// Someone's context, cut to two lines so rows stay small. Any links get buttons of their own underneath, so they're
/// one click from the browser even when cut off. Clicking the text (or "More") shows all of it, with the links inside
/// clickable; hovering shows all of it as a tooltip. Everything goes back to two lines when the dropdown reopens.
struct ContextText: View {
    let text: String
    var font: Font = .system(size: 13)
    var colour: Color = .primary.opacity(0.85)

    @State private var isExpanded = false
    @State private var fullHeight: CGFloat = 0
    @State private var shownHeight: CGFloat = 0

    private var isCutOff: Bool { fullHeight > shownHeight + 1 }
    private var links: [URL] { ContextLinks.links(in: text) }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if isExpanded {
                fullText
            }
            if !isExpanded {
                shortText
            }
            if !isExpanded && !links.isEmpty {
                linkButtons
            }
            if isExpanded || isCutOff {
                Button(isExpanded ? "Show less" : "More") { isExpanded.toggle() }
                    .buttonStyle(.link)
                    .font(.system(size: 11))
            }
        }
    }

    /// Links inside are clickable, so the text itself doesn't collapse on a click; "Show less" does.
    private var fullText: some View {
        Text(ContextLinks.attributed(text))
            .font(font)
            .foregroundStyle(colour)
            .fixedSize(horizontal: false, vertical: true)
            .textSelection(.enabled)
    }

    private var shortText: some View {
        Text(text)
            .font(font)
            .foregroundStyle(colour)
            .lineLimit(AppConstants.contextCollapsedLines)
            .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { shownHeight = $0 }
            .background(alignment: .topLeading) {
                Text(text)
                    .font(font)
                    .fixedSize(horizontal: false, vertical: true)
                    .hidden()
                    .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { fullHeight = $0 }
            }
            .help(isCutOff ? text : "")
            .contentShape(Rectangle())
            .onTapGesture { if isCutOff { isExpanded = true } }
    }

    private var linkButtons: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 6) { linkButtonList }
            VStack(alignment: .leading, spacing: 4) { linkButtonList }
        }
    }

    private var linkButtonList: some View {
        ForEach(links, id: \.self) { url in
            Link(destination: url) {
                Label(ContextLinks.label(for: url), systemImage: "arrow.up.right.square")
                    .lineLimit(1)
            }
            .font(.system(size: 11, weight: .medium))
            .padding(.horizontal, 7)
            .padding(.vertical, 2)
            .background(Capsule().fill(Color.accentColor.opacity(0.12)))
            .help(url.absoluteString)
        }
    }
}
