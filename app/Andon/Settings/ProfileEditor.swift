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
            AvatarView(member: member, colour: nil, diameter: 64)
            VStack(alignment: .leading, spacing: 6) {
                TextField("Name", text: $name)
                    .textFieldStyle(.roundedBorder)
                    .font(.title3)
                    .onSubmit(saveName)
                Text(member.email).foregroundStyle(.secondary)
                if let message {
                    Text(message).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .onAppear { name = member.name }
    }

    private func saveName() {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty, trimmedName != member.name else { return }
        Task {
            switch await accountController.updateProfile(ProfileChange(name: trimmedName)) {
            case .success:
                message = "Name saved."
            case let .failure(error):
                message = error.message
            }
        }
    }
}
