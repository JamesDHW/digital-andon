import Foundation

/// Web links in someone's context, so they can be clicked even when the text is cut short.
public enum ContextLinks {
    /// One web link found in a context: where it is in the text, and where it goes.
    public struct Found: Equatable, Sendable {
        public let range: Range<String.Index>
        public let url: URL
    }

    private static let labelPathLength = 24

    /// Every http(s) link, in order; a bare "github.com/…" counts too, as http.
    public static func find(in text: String) -> [Found] {
        let detected = tryCatch(.unexpected) { try NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) }
        guard case let .success(detector) = detected else { return [] }
        let whole = NSRange(text.startIndex..., in: text)
        return detector.matches(in: text, range: whole).compactMap { match in
            guard let url = match.url, isWebLink(url), let range = Range(match.range, in: text) else { return nil }
            return Found(range: range, url: url)
        }
    }

    /// Each link once, in order of first appearance.
    public static func links(in text: String) -> [URL] {
        find(in: text).map(\.url).reduce(into: [URL]()) { unique, url in
            if !unique.contains(url) { unique.append(url) }
        }
    }

    /// A short name for a link button: the site, then the start of the path, e.g. "github.com/theodo/andon…".
    public static func label(for url: URL) -> String {
        let host = (url.host ?? url.absoluteString).replacingOccurrences(of: "www.", with: "", options: .anchored)
        let path = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !path.isEmpty else { return host }
        let isLong = path.count > labelPathLength
        return "\(host)/\(path.prefix(labelPathLength))\(isLong ? "…" : "")"
    }

    /// The context with every link made clickable, for showing in full.
    public static func attributed(_ text: String) -> AttributedString {
        find(in: text).reduce(into: AttributedString(text)) { attributed, found in
            guard let range = Range(found.range, in: attributed) else { return }
            attributed[range].link = found.url
        }
    }

    private static func isWebLink(_ url: URL) -> Bool {
        url.scheme == "https" || url.scheme == "http"
    }
}
