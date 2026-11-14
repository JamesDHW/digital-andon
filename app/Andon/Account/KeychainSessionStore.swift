import AndonKit
import Foundation
import Security

/// The device token lives in the login Keychain, never in preferences.
struct KeychainSessionStore {
    func load() -> AccountSession? {
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query(returningData: true) as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else { return nil }
        return try? JSONDecoder().decode(AccountSession.self, from: data)
    }

    func save(_ session: AccountSession) -> Result<Void, AndonError> {
        tryCatch(.keychain) { try JSONEncoder().encode(session) }.flatMap(store)
    }

    func clear() {
        SecItemDelete(query(returningData: false) as CFDictionary)
    }

    private func store(_ data: Data) -> Result<Void, AndonError> {
        SecItemDelete(query(returningData: false) as CFDictionary)
        var attributes = query(returningData: false)
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        let status = SecItemAdd(attributes as CFDictionary, nil)
        guard status == errSecSuccess else { return .failure(AndonError(.keychain, "Couldn't save your sign-in (\(status)).")) }
        return .success(())
    }

    private func query(returningData: Bool) -> [String: Any] {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: AppConstants.keychainService,
            kSecAttrAccount as String: AppConstants.keychainAccount,
        ]
        if returningData {
            query[kSecReturnData as String] = true
            query[kSecMatchLimit as String] = kSecMatchLimitOne
        }
        return query
    }
}
