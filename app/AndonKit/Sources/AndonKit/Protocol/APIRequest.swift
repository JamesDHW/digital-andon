import Foundation

/// Builds every HTTP request the app sends. Executing them is the app's job.
public enum APIRequest {
    public static func requestCode(server: URL, email: String) -> Result<URLRequest, AndonError> {
        json("POST", server, "/auth/code/request", token: nil, body: ["email": email])
    }

    public static func verifyCode(server: URL, email: String, code: String, deviceName: String) -> Result<URLRequest, AndonError> {
        json("POST", server, "/auth/code/verify", token: nil, body: ["email": email, "code": code, "deviceName": deviceName])
    }

    public static func updateProfile(_ session: AccountSession, change: ProfileChange) -> Result<URLRequest, AndonError> {
        json("PATCH", session.server, "/me", token: session.deviceToken, body: change)
    }

    public static func replaceFollows(_ session: AccountSession, memberIDs: [MemberID]) -> Result<URLRequest, AndonError> {
        json("PUT", session.server, "/me/follows", token: session.deviceToken, body: ["memberIds": memberIDs])
    }

    public static func socket(_ session: AccountSession) -> URLRequest? {
        guard let socketURL = session.socketURL else { return nil }
        var request = URLRequest(url: socketURL)
        request.setValue("Bearer \(session.deviceToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    private static func json<Body: Encodable>(_ method: String, _ server: URL, _ path: String, token: String?, body: Body) -> Result<URLRequest, AndonError> {
        tryCatch(.invalidInput) {
            var request = URLRequest(url: server.appendingPathComponent(String(path.dropFirst())))
            request.httpMethod = method
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            if let token {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            request.httpBody = try JSONEncoder().encode(body)
            return request
        }
    }
}

/// Only your name can be changed: photos always come from Google.
public struct ProfileChange: Codable, Equatable, Sendable {
    public let name: String

    public init(name: String) {
        self.name = name
    }
}
