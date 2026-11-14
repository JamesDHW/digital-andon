// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "AndonKit",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "AndonKit", targets: ["AndonKit"]),
    ],
    targets: [
        .target(name: "AndonKit"),
        .testTarget(name: "AndonKitTests", dependencies: ["AndonKit"]),
    ]
)
