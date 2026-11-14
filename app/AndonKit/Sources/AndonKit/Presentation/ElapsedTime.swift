import Foundation

public enum ElapsedTime {
    /// "just now", "4 min", "2 h", "3 d".
    public static func describe(sinceMilliseconds: Double, now: Date) -> String {
        let elapsedSeconds = max(0, now.timeIntervalSince1970 - sinceMilliseconds / 1000)
        let minutes = Int(elapsedSeconds / 60)
        if minutes < 1 { return "just now" }
        if minutes < 60 { return "\(minutes) min" }
        let hours = minutes / 60
        if hours < 24 { return "\(hours) h" }
        return "\(hours / 24) d"
    }
}
