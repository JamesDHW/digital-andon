import AndonKit
import AppKit
import SwiftUI

/// Change your name and photo: drop an image on the avatar, choose a file, or paste a link to one (e.g. github.com/you.png).
struct ProfileEditor: View {
    @ObservedObject var accountController: AccountController
    let member: Member

    @State private var name = ""
    @State private var photoLink = ""
    @State private var message: String?
    @State private var isDropTargeted = false

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            AvatarView(member: member, colour: nil, diameter: 64)
                .overlay(Circle().strokeBorder(Color.accentColor, lineWidth: isDropTargeted ? 3 : 0))
                .dropDestination(for: URL.self) { fileURLs, _ in
                    guard let fileURL = fileURLs.first else { return false }
                    upload(fileURL)
                    return true
                } isTargeted: { isTargeted in
                    isDropTargeted = isTargeted
                }
            VStack(alignment: .leading, spacing: 8) {
                TextField("Name", text: $name).onSubmit(saveName)
                HStack {
                    TextField("Photo link (https://…)", text: $photoLink).onSubmit(savePhotoLink)
                    Button("Choose…", action: choosePhoto)
                }
                if let message {
                    Text(message).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .onAppear { name = member.name }
    }

    private func saveName() {
        save(ProfileChange(name: name, avatarUrl: nil), success: "Name saved.")
    }

    private func savePhotoLink() {
        let trimmedLink = photoLink.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedLink.isEmpty else { return }
        let link = trimmedLink.contains("://") ? trimmedLink : "https://\(trimmedLink)"
        save(ProfileChange(name: nil, avatarUrl: link), success: "Photo saved.")
    }

    private func choosePhoto() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.image]
        panel.allowsMultipleSelection = false
        guard panel.runModal() == .OK, let fileURL = panel.url else { return }
        upload(fileURL)
    }

    private func upload(_ fileURL: URL) {
        Task {
            let result = await accountController.uploadAvatar(from: fileURL)
            message = describe(result, success: "Photo saved.")
        }
    }

    private func save(_ change: ProfileChange, success: String) {
        Task {
            let result = await accountController.updateProfile(change)
            message = describe(result, success: success)
        }
    }

    private func describe(_ result: Result<Member, AndonError>, success: String) -> String {
        switch result {
        case .success: return success
        case let .failure(error): return error.message
        }
    }
}
