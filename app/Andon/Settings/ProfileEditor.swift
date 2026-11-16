import AndonKit
import SwiftUI

/// Your Google photo and email, and your name, which you can change. Photos always come from Google.
struct ProfileEditor: View {
    @ObservedObject var accountController: AccountController
    let member: Member

    @State private var name = ""
    @State private var message: String?

    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            AvatarView(member: member, colour: nil, diameter: 48)
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    TextField("Name", text: $name)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit(saveName)
                    Button("Save", action: saveName)
                        .disabled(!hasUnsavedName)
                }
                Text(member.email).foregroundStyle(.secondary)
                if let message {
                    Text(message).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .onAppear { name = member.name }
    }

    private var trimmedName: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }

    private var hasUnsavedName: Bool { !trimmedName.isEmpty && trimmedName != member.name }

    private func saveName() {
        guard hasUnsavedName else { return }
        let newName = trimmedName
        Task {
            switch await accountController.updateProfile(ProfileChange(name: newName)) {
            case .success:
                message = "Name saved."
            case let .failure(error):
                message = error.message
            }
        }
    }
}
