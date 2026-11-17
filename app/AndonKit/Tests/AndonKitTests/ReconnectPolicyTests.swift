import XCTest
@testable import AndonKit

final class ReconnectPolicyTests: XCTestCase {
    func testBacksOffExponentiallyUpToThirtySeconds() {
        XCTAssertEqual((0...6).map { ReconnectPolicy.delaySeconds(afterFailedAttempts: $0, jitter: 0.5) }, [1, 2, 4, 8, 16, 30, 30])
    }

    func testSpreadsEachDelayFromHalfToOneAndAHalfTimes() {
        XCTAssertEqual(ReconnectPolicy.delaySeconds(afterFailedAttempts: 0, jitter: 0), 0.5)
        XCTAssertEqual(ReconnectPolicy.delaySeconds(afterFailedAttempts: 0, jitter: 1), 1.5)
        XCTAssertEqual(ReconnectPolicy.delaySeconds(afterFailedAttempts: 6, jitter: 0), 15)
        XCTAssertEqual(ReconnectPolicy.delaySeconds(afterFailedAttempts: 6, jitter: 1), 45)
    }

    func testKeepsJitterWithinItsRange() {
        XCTAssertEqual(ReconnectPolicy.delaySeconds(afterFailedAttempts: 2, jitter: -3), 2)
        XCTAssertEqual(ReconnectPolicy.delaySeconds(afterFailedAttempts: 2, jitter: 7), 6)
    }
}
