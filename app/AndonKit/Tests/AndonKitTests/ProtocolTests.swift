import XCTest
@testable import AndonKit

final class ProtocolTests: XCTestCase {
    func testDecodesTheServersHello() throws {
        let state = Fixtures.helloState()
        XCTAssertEqual(state.you, Fixtures.james)
        XCTAssertEqual(state.members.count, 5)
        XCTAssertEqual(state.light(for: Fixtures.priya)?.status, "Prod deploy blocked by failing migration")
        XCTAssertEqual(state.light(for: Fixtures.marco)?.colour, .off)
        XCTAssertEqual(state.follows, [Fixtures.priya, Fixtures.tom, Fixtures.aisha, Fixtures.marco])
        XCTAssertEqual(state.online, [Fixtures.james])
    }

    func testDecodesAnOffLight() {
        guard case let .success(.light(light)) = ServerMessage.decode(Fixtures.offLightJSON) else { return XCTFail("Expected a light") }
        XCTAssertEqual(light, Light(memberId: Fixtures.marco, colour: .off, status: nil, since: 1_794_614_011_072))
    }

    func testIgnoresUnknownMessageTypesAndReportsMalformedOnes() {
        XCTAssertEqual(try ServerMessage.decode(#"{"type":"somethingNew","x":1}"#).get(), .unknown(type: "somethingNew"))
        guard case let .failure(error) = ServerMessage.decode("not json") else { return XCTFail("Expected a failure") }
        XCTAssertEqual(error.kind, .decoding)
    }

    func testDecodesErrorsPresenceFollowsAndRemovals() throws {
        XCTAssertEqual(try ServerMessage.decode(#"{"type":"error","code":"forbidden","message":"No"}"#).get(), .error(code: "forbidden", message: "No"))
        XCTAssertEqual(try ServerMessage.decode(#"{"type":"presence","memberId":"a","isOnline":false}"#).get(), .presence(memberID: MemberID(rawValue: "a"), isOnline: false))
        XCTAssertEqual(try ServerMessage.decode(#"{"type":"follows","memberIds":["a","b"]}"#).get(), .follows([MemberID(rawValue: "a"), MemberID(rawValue: "b")]))
        XCTAssertEqual(try ServerMessage.decode(#"{"type":"memberRemoved","memberId":"a"}"#).get(), .memberRemoved(MemberID(rawValue: "a")))
    }

    func testEncodesClientMessagesInTheShapeTheServerValidates() throws {
        XCTAssertEqual(try decodedObject(.pull(.red, status: nil)), ["type": "pull", "colour": "red", "status": ""])
        XCTAssertEqual(try decodedObject(.pull(.off, status: "On holiday")), ["type": "pull", "colour": "off", "status": "On holiday"])
        XCTAssertEqual(try decodedObject(.unfollow(Fixtures.priya)), ["type": "unfollow", "memberId": Fixtures.priya.rawValue])
    }

    func testParsesBothInviteLinkForms() {
        XCTAssertEqual(
            JoinInvitation.parse("andon://join?server=https%3A%2F%2Fandon.example.workers.dev&code=abc123"),
            JoinInvitation(server: URL(string: "https://andon.example.workers.dev")!, code: "abc123")
        )
        XCTAssertEqual(
            JoinInvitation.parse("  https://andon.example.workers.dev/join/?code=abc123 \n"),
            JoinInvitation(server: URL(string: "https://andon.example.workers.dev")!, code: "abc123")
        )
        XCTAssertEqual(JoinInvitation.parse("http://localhost:8787/join/?code=x")?.server, URL(string: "http://localhost:8787")!)
        XCTAssertNil(JoinInvitation.parse("https://andon.example.workers.dev/join/"))
        XCTAssertNil(JoinInvitation.parse("mailto:someone@example.com?code=x"))
    }

    func testBuildsTheSocketURLFromTheServerOrigin() {
        let secure = AccountSession(server: URL(string: "https://andon.example.workers.dev")!, deviceToken: "t")
        let local = AccountSession(server: URL(string: "http://localhost:8787")!, deviceToken: "t")
        XCTAssertEqual(secure.socketURL?.absoluteString, "wss://andon.example.workers.dev/ws")
        XCTAssertEqual(local.socketURL?.absoluteString, "ws://localhost:8787/ws")
        XCTAssertEqual(APIRequest.socket(local)?.value(forHTTPHeaderField: "Authorization"), "Bearer t")
    }

    private func decodedObject(_ message: ClientMessage) throws -> [String: String] {
        let text = try message.encoded().get()
        return try JSONDecoder().decode([String: String].self, from: Data(text.utf8))
    }
}
