import Foundation

/// The error adapter: the only place that catches. Callers branch on the returned Result.
public func tryCatch<Value>(_ kind: AndonError.Kind, _ operation: () throws -> Value) -> Result<Value, AndonError> {
    do {
        return .success(try operation())
    } catch let andonError as AndonError {
        return .failure(andonError)
    } catch {
        return .failure(AndonError(kind, error.localizedDescription))
    }
}

public func tryCatchAsync<Value>(_ kind: AndonError.Kind, _ operation: () async throws -> Value) async -> Result<Value, AndonError> {
    do {
        return .success(try await operation())
    } catch let andonError as AndonError {
        return .failure(andonError)
    } catch {
        return .failure(AndonError(kind, error.localizedDescription))
    }
}
