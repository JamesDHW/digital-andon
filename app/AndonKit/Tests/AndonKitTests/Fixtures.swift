import Foundation
@testable import AndonKit

/// Messages captured from the real backend (pnpm dev), so these tests also check the wire contract.
enum Fixtures {
    static let helloJSON = #"""
    {"type":"hello","you":"8172a26f-678f-42dd-a01d-3d5353de8d35","members":[{"id":"25f05127-7357-4f07-92ed-85c773082bf1","name":"Aisha","email":"aisha@example.com","avatarUrl":null,"role":"member","joinedAt":1794614008993},{"id":"8172a26f-678f-42dd-a01d-3d5353de8d35","name":"James","email":"james@example.com","avatarUrl":null,"role":"admin","joinedAt":1794614008958},{"id":"e8b5b1f2-739e-4b47-b61a-8bea57f12088","name":"Marco","email":"marco@example.com","avatarUrl":null,"role":"member","joinedAt":1794614008991},{"id":"1f3c4ef8-6628-4b40-b260-eb14b3d8c24f","name":"Priya","email":"priya@example.com","avatarUrl":null,"role":"member","joinedAt":1794614008981},{"id":"37599c30-44ad-4d31-be0c-7698e4e665aa","name":"Tom","email":"tom@example.com","avatarUrl":null,"role":"member","joinedAt":1794614008992}],"lights":[{"memberId":"25f05127-7357-4f07-92ed-85c773082bf1","colour":"amber","topic":null,"since":1794614010151},{"memberId":"8172a26f-678f-42dd-a01d-3d5353de8d35","colour":"green","topic":null,"since":1794614008958},{"memberId":"e8b5b1f2-739e-4b47-b61a-8bea57f12088","colour":"off","topic":null,"since":1794614011072},{"memberId":"1f3c4ef8-6628-4b40-b260-eb14b3d8c24f","colour":"red","topic":"Prod deploy blocked by failing migration","since":1794614009180},{"memberId":"37599c30-44ad-4d31-be0c-7698e4e665aa","colour":"green","topic":null,"since":1794614008992}],"follows":["1f3c4ef8-6628-4b40-b260-eb14b3d8c24f","37599c30-44ad-4d31-be0c-7698e4e665aa","25f05127-7357-4f07-92ed-85c773082bf1","e8b5b1f2-739e-4b47-b61a-8bea57f12088"],"online":["8172a26f-678f-42dd-a01d-3d5353de8d35"],"serverTime":1794614011964}
    """#

    static let offLightJSON = #"""
    {"type":"light","light":{"memberId":"e8b5b1f2-739e-4b47-b61a-8bea57f12088","colour":"off","topic":null,"since":1794614011072}}
    """#

    static let james = MemberID(rawValue: "8172a26f-678f-42dd-a01d-3d5353de8d35")
    static let priya = MemberID(rawValue: "1f3c4ef8-6628-4b40-b260-eb14b3d8c24f")
    static let aisha = MemberID(rawValue: "25f05127-7357-4f07-92ed-85c773082bf1")
    static let marco = MemberID(rawValue: "e8b5b1f2-739e-4b47-b61a-8bea57f12088")
    static let tom = MemberID(rawValue: "37599c30-44ad-4d31-be0c-7698e4e665aa")

    /// When the captured messages were sent, in seconds since 1970.
    static let capturedAt = Date(timeIntervalSince1970: 1_794_614_011.964)

    static func helloState() -> TeamState {
        guard case let .success(.hello(hello)) = ServerMessage.decode(helloJSON) else { return emptyState }
        return TeamState(hello: hello)
    }

    static let emptyState = TeamState(you: james, members: [:], lights: [:], follows: [], online: [])

    static func member(_ name: String, joinedAt: Double = 0) -> Member {
        Member(id: MemberID(rawValue: name.lowercased()), name: name, email: "\(name.lowercased())@example.com", avatarUrl: nil, role: .member, joinedAt: joinedAt)
    }

    static func light(_ name: String, _ colour: Colour, since: Double, topic: String? = nil) -> Light {
        Light(memberId: MemberID(rawValue: name.lowercased()), colour: colour, topic: topic, since: since)
    }

    /// A team where "lead" follows every other member, all online.
    static func team(_ lights: [Light], leadColour: Colour = .green) -> TeamState {
        let lead = member("Lead")
        let members = [lead] + lights.map { member($0.memberId.rawValue.capitalized) }
        let leadLight = Light(memberId: lead.id, colour: leadColour, topic: nil, since: 0)
        return TeamState(
            you: lead.id,
            members: Dictionary(uniqueKeysWithValues: members.map { ($0.id, $0) }),
            lights: Dictionary(uniqueKeysWithValues: (lights + [leadLight]).map { ($0.memberId, $0) }),
            follows: lights.map(\.memberId),
            online: Set(members.map(\.id))
        )
    }
}
