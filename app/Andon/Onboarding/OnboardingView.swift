import AndonKit
import SwiftUI

struct OnboardingView: View {
    @ObservedObject var model: OnboardingModel
    @ObservedObject var teamStore: TeamStore
    @ObservedObject var accountController: AccountController
    let onFinish: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                LightDot(colour: .green)
                LightDot(colour: .amber)
                LightDot(colour: .red)
            }
            stepContent
            if let problem = model.problem {
                Text(problem).font(.callout).foregroundStyle(.red)
            }
        }
        .padding(24)
        .frame(width: 440)
        .disabled(model.isWorking)
    }

    @ViewBuilder
    private var stepContent: some View {
        switch model.step {
        case .welcome:
            welcomeStep
        case .invite:
            inviteStep
        case .email:
            emailStep
        case .code:
            codeStep
        case .profile:
            profileStep
        }
    }

    private var welcomeStep: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Sign in to Digital Andon").font(.title2.weight(.semibold))
            Text("Use your work Google account. Your name and photo come with it, so your team knows who's stopped.")
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            if model.isServerFieldShown {
                TextField("Team address, e.g. https://andon.yourteam.workers.dev", text: $model.serverText).textFieldStyle(.roundedBorder)
            }
            Button(action: model.signInWithGoogle) {
                Text("Continue with Google").font(.headline).frame(maxWidth: .infinity, minHeight: 28)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .keyboardShortcut(.defaultAction)
            HStack {
                Button("Have an invite link?") { model.show(.invite) }.buttonStyle(.link)
                Spacer()
                Button("Use an email code") { model.show(.email) }.buttonStyle(.link)
            }
            .font(.callout)
        }
    }

    private var inviteStep: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Join your team's andon board").font(.title2.weight(.semibold))
            Text("Open the invite link from your email, or paste it here.").foregroundStyle(.secondary)
            TextField("https://andon.yourteam.workers.dev/join/?code=…", text: $model.inviteText)
                .textFieldStyle(.roundedBorder)
                .onSubmit(model.join)
            HStack {
                Button("Back") { model.show(.welcome) }.buttonStyle(.link)
                Spacer()
                Button("Join", action: model.join).keyboardShortcut(.defaultAction)
            }
        }
    }

    private var emailStep: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Sign in on this Mac").font(.title2.weight(.semibold))
            Text("We'll email you a 6-digit code. No password needed.").foregroundStyle(.secondary)
            if model.isServerFieldShown {
                TextField("Team address, e.g. https://andon.yourteam.workers.dev", text: $model.serverText).textFieldStyle(.roundedBorder)
            }
            TextField("you@company.com", text: $model.email).textFieldStyle(.roundedBorder).onSubmit(model.requestCode)
            HStack {
                Button("Back") { model.show(.welcome) }.buttonStyle(.link)
                Spacer()
                Button("Email me a code", action: model.requestCode).keyboardShortcut(.defaultAction)
            }
        }
    }

    private var codeStep: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Check your email").font(.title2.weight(.semibold))
            Text("Enter the code sent to \(model.email). It expires in 10 minutes.").foregroundStyle(.secondary)
            TextField("123456", text: $model.code).textFieldStyle(.roundedBorder).font(.title3.monospacedDigit()).onSubmit(model.verifyCode)
            HStack {
                Button("Send a new code", action: model.requestCode).buttonStyle(.link)
                Spacer()
                Button("Sign in", action: model.verifyCode).keyboardShortcut(.defaultAction)
            }
        }
    }

    @ViewBuilder
    private var profileStep: some View {
        Text("You're in. Check your name and photo so your team recognises you.").font(.title3.weight(.semibold))
        if let yourself = teamStore.state?.yourself {
            ProfileEditor(accountController: accountController, member: yourself)
        }
        if teamStore.state?.yourself == nil {
            ProgressView("Connecting…")
        }
        Text("Shortcuts: ⌃⌥↑ and ⌃⌥↓ change your light, ⌃⌥S sets your status, ⌃⌥O switches you off. Change them in Settings.")
            .font(.callout)
            .foregroundStyle(.secondary)
        HStack {
            Spacer()
            Button("Done", action: onFinish).keyboardShortcut(.defaultAction)
        }
    }
}
