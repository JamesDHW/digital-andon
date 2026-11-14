import Foundation

/// An invite, from either the app link (andon://join?server=…&code=…) or the emailed web link (https://…/join/?code=…).
public struct JoinInvitation: Equatable, Sendable {
    public let server: URL
    public let code: String

    public init(server: URL, code: String) {
        self.server = server
        self.code = code
    }

    public static func parse(_ text: String) -> JoinInvitation? {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let components = URLComponents(string: trimmedText) else { return nil }
        guard let code = queryValue("code", in: components), !code.isEmpty else { return nil }

        switch components.scheme {
        case "andon":
            return fromAppLink(components, code: code)
        case "https", "http":
            return fromWebLink(components, code: code)
        default:
            return nil
        }
    }

    private static func fromAppLink(_ components: URLComponents, code: String) -> JoinInvitation? {
        guard components.host == "join" else { return nil }
        guard let serverText = queryValue("server", in: components), let server = URL(string: serverText) else { return nil }
        return JoinInvitation(server: server, code: code)
    }

    private static func fromWebLink(_ components: URLComponents, code: String) -> JoinInvitation? {
        var serverComponents = URLComponents()
        serverComponents.scheme = components.scheme
        serverComponents.host = components.host
        serverComponents.port = components.port
        guard let server = serverComponents.url else { return nil }
        return JoinInvitation(server: server, code: code)
    }

    private static func queryValue(_ name: String, in components: URLComponents) -> String? {
        components.queryItems?.first(where: { $0.name == name })?.value
    }
}
