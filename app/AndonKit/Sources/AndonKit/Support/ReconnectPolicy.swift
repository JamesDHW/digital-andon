import Foundation

public enum ReconnectPolicy {
    public static let initialDelaySeconds: Double = 1
    public static let maximumDelaySeconds: Double = 30

    /// 1 s, 2 s, 4 s … capped at 30 s.
    public static func delaySeconds(afterFailedAttempts attempts: Int) -> Double {
        let exponent = Double(min(max(attempts, 0), 10))
        return min(initialDelaySeconds * pow(2, exponent), maximumDelaySeconds)
    }
}
