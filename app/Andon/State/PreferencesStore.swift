import AndonKit
import Combine
import Foundation

/// Per-Mac preferences. The follow list is not here: it lives on the server so it follows you to a new Mac.
@MainActor
final class PreferencesStore: ObservableObject {
    @Published var preferences: Preferences {
        didSet { save() }
    }

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        let stored = defaults.data(forKey: AppConstants.preferencesDefaultsKey).flatMap { data in
            try? JSONDecoder().decode(Preferences.self, from: data)
        }
        self.preferences = stored ?? .standard
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(preferences) else { return }
        defaults.set(data, forKey: AppConstants.preferencesDefaultsKey)
    }
}
