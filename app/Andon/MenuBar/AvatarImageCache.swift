import AppKit
import Combine

/// Profile photos for the menu bar, downloaded once per URL and kept for the life of the app.
/// Until a photo arrives (or if it can't be fetched) the person's initial is drawn instead.
@MainActor
final class AvatarImageCache: ObservableObject {
    /// Bumped whenever a photo arrives, so the status item knows to redraw.
    @Published private(set) var revision = 0

    private let urlSession: URLSession
    private var images: [URL: NSImage] = [:]
    private var requested: Set<URL> = []

    init(urlSession: URLSession = .shared) {
        self.urlSession = urlSession
    }

    /// The photo if it has loaded. Otherwise starts fetching it (once) and returns nil.
    func image(for url: URL?) -> NSImage? {
        guard let url else { return nil }
        if let image = images[url] { return image }
        fetch(url)
        return nil
    }

    private func fetch(_ url: URL) {
        guard !requested.contains(url) else { return }
        requested.insert(url)
        let urlSession = urlSession
        Task { [weak self] in
            let image = await Self.download(url, with: urlSession)
            self?.store(image, for: url)
        }
    }

    private func store(_ image: NSImage?, for url: URL) {
        guard let image else { return }
        images[url] = image
        revision += 1
    }

    private static func download(_ url: URL, with urlSession: URLSession) async -> NSImage? {
        guard let download = try? await urlSession.data(from: url) else { return nil }
        guard (download.1 as? HTTPURLResponse)?.statusCode == 200 else { return nil }
        return NSImage(data: download.0)
    }
}
