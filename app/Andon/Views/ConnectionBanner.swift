import AndonKit
import SwiftUI

/// Shown only when something is wrong: signed out, reconnecting, or the server refused a change.
struct ConnectionBanner: View {
    let connection: ConnectionState
    let problem: String?
    let onDismissProblem: () -> Void
    let onSignIn: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            connectionMessage
            if let problem {
                HStack(alignment: .top) {
                    Text(problem).font(.callout)
                    Spacer()
                    Button(action: onDismissProblem) { Image(systemName: "xmark") }.buttonStyle(.borderless)
                }
                .padding(8)
                .background(RoundedRectangle(cornerRadius: 6).fill(Color.orange.opacity(0.15)))
            }
        }
        .padding(.horizontal, 14)
        .padding(.top, connection == .connected && problem == nil ? 0 : 10)
    }

    @ViewBuilder
    private var connectionMessage: some View {
        switch connection {
        case .connected:
            EmptyView()
        case .connecting:
            Label("Connecting…", systemImage: "arrow.triangle.2.circlepath").font(.callout).foregroundStyle(.secondary)
        case .disconnected:
            Label("Offline — reconnecting. Lights may be out of date.", systemImage: "wifi.slash").font(.callout).foregroundStyle(.secondary)
        case .signedOut:
            HStack {
                Text("Join your team to see their lights.").font(.callout)
                Spacer()
                Button("Join…", action: onSignIn)
            }
        }
    }
}
