import Foundation

public enum ReconnectPolicy {
    public static let initialDelaySeconds: Double = 1
    public static let maximumDelaySeconds: Double = 30
    /// Each delay lands anywhere from half to one and a half times the backoff, so a team whose sockets all dropped
    /// together (a deploy restarts the server) doesn't reconnect in the same instant.
    public static let jitterSpread: Double = 0.5

    /// 1 s, 2 s, 4 s … capped at 30 s, then spread by `jitter`: 0 is the shortest, 0.5 the backoff itself, 1 the longest.
    /// Pass `Double.random(in: 0...1)`; tests pass a fixed value.
    public static func delaySeconds(afterFailedAttempts attempts: Int, jitter: Double) -> Double {
        let exponent = Double(min(max(attempts, 0), 10))
        let backoff = min(initialDelaySeconds * pow(2, exponent), maximumDelaySeconds)
        let spread = (min(max(jitter, 0), 1) * 2 - 1) * jitterSpread
        return backoff * (1 + spread)
    }
}
