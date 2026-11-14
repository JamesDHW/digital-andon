import AndonKit
import Foundation

/// Executes requests built by AndonKit's APIRequest and turns every failure into an AndonError.
struct HTTPTransport {
    private static let unauthorisedStatus = 401
    private static let successStatuses = 200..<300

    let urlSession: URLSession

    func send<Response: Decodable>(_ request: Result<URLRequest, AndonError>, expecting: Response.Type) async -> Result<Response, AndonError> {
        switch request {
        case let .failure(error):
            return .failure(error)
        case let .success(urlRequest):
            let body = await data(for: urlRequest)
            return body.flatMap { data in tryCatch(.decoding) { try JSONDecoder().decode(Response.self, from: data) } }
        }
    }

    func send(_ request: Result<URLRequest, AndonError>) async -> Result<Void, AndonError> {
        switch request {
        case let .failure(error):
            return .failure(error)
        case let .success(urlRequest):
            return await data(for: urlRequest).map { _ in () }
        }
    }

    private func data(for request: URLRequest) async -> Result<Data, AndonError> {
        let exchange = await tryCatchAsync(.network) { try await urlSession.data(for: request) }
        return exchange.flatMap { dataAndResponse in
            let (data, response) = dataAndResponse
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            if status == Self.unauthorisedStatus { return .failure(AndonError(.unauthorised, "Sign in again to continue.")) }
            if Self.successStatuses.contains(status) { return .success(data) }
            let serverError = try? JSONDecoder().decode(ServerErrorBody.self, from: data)
            return .failure(AndonError(.server, serverError?.message ?? "The server answered \(status)."))
        }
    }
}
