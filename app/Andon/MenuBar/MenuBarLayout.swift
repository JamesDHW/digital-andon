import AppKit

/// Point sizes for the status item image: a squircle for your own light, then one ringed avatar per person.
/// Up to four people sit side by side; beyond that they overlap like a facepile so the item stays compact.
enum MenuBarLayout {
    static let height: CGFloat = 22
    static let edgeInset: CGFloat = 1
    static let ownLightSide: CGFloat = 18
    /// About a third of the side, close to the continuous corners of a macOS app icon.
    static let ownLightCornerRadius: CGFloat = 5.5
    static let ownToPeopleGap: CGFloat = 5
    static let avatarDiameter: CGFloat = 20
    /// The thick ring in the person's light colour; it carries the signal, the photo says who.
    static let ringWidth: CGFloat = 2.5
    static let ringToPhotoGap: CGFloat = 1
    static let separateAvatarGap: CGFloat = 3
    static let maximumSeparateAvatars = 4
    /// Overlapping avatars advance by this fraction of their diameter.
    static let overlapStepFraction: CGFloat = 0.7
    /// The transparent gap cut around an avatar where the next one tucks behind it.
    static let overlapCutout: CGFloat = 1.5
    static let initialFontScale: CGFloat = 0.62
    static let staleAlpha: CGFloat = 0.45
    /// A breathing light fades down to this and back up again.
    static let breathingMinimumAlpha: CGFloat = 0.35
    static let placeholderDiameter: CGFloat = 12
    static let placeholderLineWidth: CGFloat = 1.5

    static var photoInset: CGFloat { ringWidth + ringToPhotoGap }

    static func avatarStep(count: Int) -> CGFloat {
        if count <= maximumSeparateAvatars { return avatarDiameter + separateAvatarGap }
        return avatarDiameter * overlapStepFraction
    }

    static func peopleWidth(count: Int) -> CGFloat {
        guard count > 0 else { return 0 }
        return avatarDiameter + CGFloat(count - 1) * avatarStep(count: count)
    }
}
