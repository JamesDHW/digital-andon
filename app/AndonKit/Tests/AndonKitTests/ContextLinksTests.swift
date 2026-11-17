import XCTest
@testable import AndonKit

final class ContextLinksTests: XCTestCase {
    private let context = "Resolving difficulty with getting Java 8 on SMBC's envs https://github.com/theodo/smbc-infra/issues/42, see also docs.example.com/java"

    func testFindsEachWebLinkInOrderIncludingBareDomains() {
        let links = ContextLinks.links(in: context)
        XCTAssertEqual(links.first?.absoluteString, "https://github.com/theodo/smbc-infra/issues/42")
        XCTAssertEqual(links.count, 2)
        XCTAssertEqual(links.last?.host, "docs.example.com")
    }

    func testIgnoresContextWithNoLinksAndNonWebSchemes() {
        XCTAssertEqual(ContextLinks.links(in: "Waiting on infra"), [])
        XCTAssertEqual(ContextLinks.links(in: "Mail priya@example.com about it"), [])
    }

    func testListsARepeatedLinkOnce() {
        XCTAssertEqual(ContextLinks.links(in: "https://a.dev/x and again https://a.dev/x").count, 1)
    }

    func testLabelsALinkWithItsSiteAndTheStartOfItsPath() throws {
        XCTAssertEqual(ContextLinks.label(for: try XCTUnwrap(URL(string: "https://www.github.com/"))), "github.com")
        XCTAssertEqual(ContextLinks.label(for: try XCTUnwrap(URL(string: "https://github.com/theodo/smbc-infra/issues/42"))), "github.com/theodo/smbc-infra/issues…")
    }

    func testMakesTheLinksInTheFullTextClickable() {
        let attributed = ContextLinks.attributed(context)
        let linked = attributed.runs.compactMap { $0.link }
        XCTAssertEqual(linked.first?.absoluteString, "https://github.com/theodo/smbc-infra/issues/42")
        XCTAssertEqual(String(attributed.characters), context)
    }
}
