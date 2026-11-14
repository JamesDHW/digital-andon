import Foundation

/// The full team state the server sends on every (re)connect.
public struct Hello: Codable, Equatable, Sendable {
    public let you: MemberID
    public let members: [Member]
    public let lights: [Light]
    public let follows: [MemberID]
    public let online: [MemberID]
    public let serverTime: Double

    public init(you: MemberID, members: [Member], lights: [Light], follows: [MemberID], online: [MemberID], serverTime: Double) {
        self.you = you
        self.members = members
        self.lights = lights
        self.follows = follows
        self.online = online
        self.serverTime = serverTime
    }
}
