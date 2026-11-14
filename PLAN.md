# Digital andon — implementation plan

A macOS menu bar app that lets anyone on the team pull a digital andon cord
(green / amber / red) with a keyboard shortcut, and lets the people who follow
them see it in their menu bar instantly. Red lights are acknowledged by a
follower; everything is logged so response times can be measured later.

Non-technical people must be able to install and join with no accounts,
passwords, GitHub or Slack.

> **Superseded in places.** This is the original plan. Since then: there is no acknowledgement (red means "waiting for a person", and a red breathes after 10 minutes instead); there is a fourth state, **Off**, which hides you from every menu bar; the menu bar shows one ringed avatar per person you follow, with no limit, instead of a 2×2 grid; the soft palette and "hide own light" options are gone; and there are no projects, only who you follow. The README describes the current behaviour.

---

## 1. Decisions already made

| Area | Decision |
|---|---|
| Client | Native macOS app. AppKit `NSStatusItem` for the menu bar (full colour, custom drawn), SwiftUI for the dropdown and Settings. macOS 14+. |
| Menu bar layout | Left: own light as a rounded square (hideable). Right: 2×2 grid of 8pt circles showing the 4 highest-severity people you follow. Pale fill + saturated outline. Unacknowledged red = outline only. |
| Pull the cord | **Plain shortcut = instant, no prompt.** `⌃⌥G` green, `⌃⌥A` amber, `⌃⌥R` red. **Shift variant = with a topic:** `⌃⌥⇧A`, `⌃⌥⇧R` open a one-line field; Enter sends, Esc cancels. Topic is never required. Topic can be added or edited later from the dropdown. |
| Acknowledge | Only red needs acknowledging. Only followers can acknowledge. First ack wins; everyone sees who. `⌃⌥K` acks the oldest unacknowledged red. |
| Resolve | Only the person themselves sets green. Optional "what unblocked it?" prompt on resolve, skippable. |
| Notifications | Default: red only, one banner with Acknowledge / Open actions, plus one reminder after 10 min if still unacknowledged (configurable, can be off). Amber/green off by default. Global "Colours only" switch kills all notifications locally. Respects macOS Focus. |
| Following | Each user picks who to follow. Stored server-side so it follows you to any Mac. Private: nobody is told who follows them. Change it from Settings → Following (checklist) or straight from the dropdown ("Everyone else" section with follow toggles; right-click a followed row → Unfollow). New members are auto-followed by whoever invited them, nobody else. |
| Identity | Invite link from an admin → app opens → done. Recovery / new Mac: email + 6-digit code, restricted to allowed email domains. Photo: drag in an image, pick a file, paste a URL, or fall back to coloured initials. |
| Backend | Cloudflare Worker + one Durable Object per team (holds live state + WebSocket fan-out, SQLite storage for the event log). Resend for email. |
| Distribution | Signed + notarized `.dmg` on a GitHub Release (primary, for everyone), Sparkle for auto-update, Homebrew cask in `yourorg/homebrew-tap` as a convenience for developers. |
| Observability | Every pull / ack / resolve / topic-edit is an event with a timestamp. A `POST /api/pull` endpoint with a team API key lets CI or alerting pull a light on behalf of a synthetic "CI" member later. |

---

## 2. Architecture

```
┌──────────────── Mac (each team member) ────────────────┐
│  Andon.app                                              │
│   ├─ StatusItemController  (NSStatusItem, draws image)  │
│   ├─ HotkeyManager         (KeyboardShortcuts package)  │
│   ├─ TeamStore             (@Observable, source of truth│
│   │                         for lights, acks, members)  │
│   ├─ RealtimeClient        (URLSessionWebSocketTask,    │
│   │                         reconnect + resync)         │
│   ├─ NotificationManager   (UNUserNotificationCenter)   │
│   ├─ Views: DropdownView, SettingsView, TopicPrompt     │
│   └─ Keychain: device token                             │
└────────────────────────┬────────────────────────────────┘
                         │ wss:// + https://
┌────────────────────────▼────────────────────────────────┐
│  Cloudflare Worker  (plain fetch router, no framework)  │
│   /auth/*  /team/*  /ws  /api/pull                      │
│          │                                              │
│   TeamObject (Durable Object, one per team)             │
│    ├─ in-memory: members, current lights, sockets       │
│    ├─ SQLite: members, devices, events, invites         │
│    └─ alarms: reminder nudges, offline detection        │
│                                                         │
│   Resend  (invite + login-code email)                   │
└─────────────────────────────────────────────────────────┘
```

Why a Durable Object: a team is a tiny amount of state with many readers that
need pushes in < 1 s. One DO per team gives a single-threaded, consistent
place to hold it, native WebSockets with hibernation (cheap when idle), and a
built-in SQLite for the event log. No separate database, queue or server.

---

## 3. Repo layout (as built)

```
digital-andon/
├── backend/                  Cloudflare Worker, checked by architecture-rules (layers in architecture.config.ts)
│   ├── src/errors            AndonError hierarchy + tryCatch (the only code that catches)
│   ├── src/domain            pullCord, acknowledgeLight, changeTopic, topics, members, events — pure
│   ├── src/protocol          socket messages + zod validation (the contract with the app)
│   ├── src/application       socket commands, follows, auth (invite / email code / dev sign-in), profile, admin
│   ├── src/adapters          SQLite stores (one per port), Web Crypto secrets, Resend + console mailers
│   ├── src/http              JSON endpoints and router
│   ├── src/runtime           worker.ts, TeamObject (Durable Object), sockets, R2 avatars, composition root
│   ├── public/               /admin page, /join invite landing page
│   ├── scripts/              seedDevTeam.ts, fakeMember.ts
│   └── test/                 vitest on node:sqlite with fake clock / secrets / mailer
├── app/
│   ├── AndonKit/             Swift package: models, protocol, TeamState reducer, Ranking, MenuBarModel,
│   │                         DropdownModel, NotificationPlanner, Light.pulled (+ XCTest, fixtures captured from the backend)
│   ├── Andon/                App, Account, State, MenuBar, Hotkeys, Notifications, Windows, Views, Settings, Onboarding
│   ├── Config/Andon.xcconfig bundle id, team, default server, Sparkle feed + key
│   └── project.yml           XcodeGen spec (KeyboardShortcuts 2.4.0, Sparkle 2.8.1)
├── scripts/                  build-release.sh, update-homebrew-tap.sh
├── homebrew/                 andon.rb.template
├── docs/                     menubar-preview.png
└── .github/workflows/        ci.yml, deploy-backend.yml, release.yml
```

Changes from the first draft of this plan:
- No Hono: a plain switch router keeps dependencies to zod alone.
- Ranking lives only in the app (AndonKit); the server doesn't need it.
- Presence is "has an open socket" rather than an alarm sweep; hibernating sockets make this free.
- Appcast and dmg are hosted on GitHub Releases (`releases/latest/download/…`), not R2.
- A development-only `/dev/sign-in` (needs `DEV_MODE=true`) lets the seed and fake-member scripts work without email.
- Topic prompts are on the ⇧ shortcuts only; plain shortcuts never ask anything.

## 4. Data model

### Backend (Durable Object SQLite)

```sql
members   (id TEXT PK, name TEXT, email TEXT UNIQUE, avatar_url TEXT, role TEXT CHECK(role IN ('member','admin')), created_at INT)
devices   (token_hash TEXT PK, member_id TEXT, name TEXT, last_seen_at INT, created_at INT)
invites   (code TEXT PK, email TEXT, name TEXT, created_by TEXT, expires_at INT, used_at INT)
login_codes (email TEXT, code TEXT, expires_at INT, attempts INT)
follows   (follower_id TEXT, followee_id TEXT, created_at INT, PRIMARY KEY (follower_id, followee_id))
events    (id INT PK AUTOINCREMENT, ts INT, member_id TEXT, kind TEXT, colour TEXT, topic TEXT, by_member_id TEXT, note TEXT)
          -- kind: pull | topic | ack | resolve | offline | online
settings  (key TEXT PK, value TEXT)   -- allowed_domains, team_name, reminder_minutes, api_key_hash
```

Current light per member is derived from the latest `pull`/`resolve` event and
cached in memory on the DO; it is rebuilt from `events` on cold start.

### Wire protocol (JSON over WebSocket, `type` field)

Server → client
```
hello      { you: Member, members: Member[], lights: Light[], follows: MemberId[], serverTime }
light      { memberId, colour, topic, since, ackedBy, ackedAt }      // any change
presence   { memberId, online: bool }
member     { member: Member }                                        // joined / edited
follows    { memberIds: MemberId[] }                                 // your follow list changed (e.g. from another Mac)
ping
```
Client → server
```
pull       { colour: "green"|"amber"|"red", topic?: string }
topic      { topic: string }
ack        { memberId }
resolve    { note?: string }
follow     { memberId }
unfollow   { memberId }
pong
```

`Light = { memberId, colour, topic, since, ackedBy?, ackedAt? }`

### Client (Swift)

```swift
enum Colour: String, Codable { case green, amber, red }
struct Member: Identifiable, Codable { id, name, email, avatarURL }
struct Light: Codable { memberId, colour, topic, since, ackedBy, ackedAt }
struct Prefs: Codable {              // UserDefaults
  showOwnLight = true
  hideWhenAllGreen = false
  gridSlots = 4                      // 0…6
  notifyRed = .banner, notifyAmber = .off, notifyGreen = .off
  coloursOnly = false
  reminderMinutes = 10
}
// The follow list is NOT a local pref: it lives on the server (see `follows` table)
// so it survives a new Mac, and the server needs it to authorise acknowledgements.
```

### Severity ranking (identical in `Ranking.swift` and `ranking.ts`)

1. red, unacknowledged — oldest first
2. red, acknowledged — oldest first
3. amber — oldest first
4. green — most recently changed first
5. offline — never shown in the menu bar, greyed in dropdown

Only followed members are ranked. Slots beyond the count stay empty.

---

## 5. HTTP API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/invite` | admin device token | `{email, name}` → emails invite link `andon://join?code=…`, returns link too |
| POST | `/auth/redeem` | none | `{code, deviceName}` → `{deviceToken, teamId}` |
| POST | `/auth/code/request` | none | `{email}` → emails 6-digit code if domain allowed and member exists |
| POST | `/auth/code/verify` | none | `{email, code, deviceName}` → `{deviceToken, teamId}` |
| GET | `/me` | device token | member + prefs that live server-side (none for now) |
| PATCH | `/me` | device token | `{name?, avatarURL?}`; multipart upload → stored in R2, URL returned |
| GET | `/me/follows` | device token | `{memberIds}` |
| PUT | `/me/follows` | device token | `{memberIds}` replaces the whole list (used by the Settings checklist) |
| GET | `/team/members` | device token | list |
| GET | `/team/events?since=&memberId=` | device token | event log (JSON / CSV) — the observability hook |
| GET | `/ws` | device token (query or header) | upgrade to WebSocket, routed to the team DO |
| POST | `/api/pull` | team API key | `{memberId, colour, topic}` for CI / alerting |
| GET | `/admin` | admin device token | static admin page |
| GET | `/appcast.xml` | none | Sparkle feed (generated by release CI, served from R2) |

Device tokens: 32 random bytes, stored hashed in `devices`, kept in the macOS
Keychain. No expiry; revocable from the admin page.

---

## 6. Build phases

Each phase ends in something you can run. Estimated effort assumes Claude Code
is doing most of the typing.

### Phase 0 — Skeleton (half a day)
- [ ] `backend/`: Worker + DO + wrangler config; `/health`; vitest harness.
- [ ] `app/`: xcodegen project, `LSUIElement = YES` (no Dock icon), empty `NSStatusItem` showing a green square.
- [ ] `ci.yml` runs both test suites.
- **Done when:** `wrangler dev` answers `/health`, app launches with a square in the bar.

### Phase 1 — Lights with no auth (1 day)
- [ ] DO: in-memory lights, WebSocket accept with hibernation API, `pull`/`resolve`/`ack` broadcast.
- [ ] Dev-only `DEV_MEMBER_ID` query param on `/ws` so you can connect as anyone.
- [ ] App: `TeamStore`, `RealtimeClient` (connect, decode `hello`, apply `light`), reconnect with backoff + full resync on reconnect.
- [ ] `StatusImageRenderer`: draws own square + 2×2 grid into an `NSImage` (non-template) at 1x/2x; unit-tested by pixel-sampling.
- [ ] `HotkeyManager` with the 5 pull shortcuts + ack shortcut.
- [ ] `scripts/fake-member.ts`: `fake-member priya red "deploy blocked"` etc.
- **Done when:** two app instances (or app + fake-member) see each other change within 1 s.

### Phase 2 — Dropdown, topics, acks, notifications (1–2 days)
- [ ] `DropdownView` as an `NSPopover`: "Needs you" section, acknowledged reds, ambers, collapsed greens/offline, own-light segmented control, Colours-only toggle, Settings… link.
- [ ] "Everyone else" section (collapsed by default) listing people you don't follow, each with a Follow button; right-click a followed row → Unfollow. Sends `follow` / `unfollow` over the socket.
- [ ] `TopicPromptWindow`: floating borderless window centred on screen, opened by Shift shortcuts and by "Add topic" in the dropdown.
- [ ] Ack from row, from notification action, from `⌃⌥K`.
- [ ] `NotificationManager`: category with Acknowledge/Open actions; red-only default; reminder scheduled locally and cancelled on ack; Focus respected automatically; Colours-only suppresses everything.
- [ ] Developer-side: own square pulses (2 s opacity cycle) while own red is unacknowledged; dropdown shows "James is on it".
- [ ] Resolve prompt (optional note) → `resolve {note}`.
- **Done when:** the full pull → notify → ack → resolve loop works between two machines.

### Phase 3 — Identity and onboarding (1–2 days)
- [ ] `settings.allowed_domains`; first admin bootstrapped with `wrangler secret` / seed script.
- [ ] Invite flow: admin page → `/auth/invite` → Resend email → `andon://join?code=` URL scheme registered in Info.plist → `/auth/redeem` → token in Keychain.
- [ ] Email-code login for new Macs.
- [ ] `OnboardingView`: shown on first launch: "Paste your invite link or enter your work email". Then name + photo (drag/drop, file picker, URL, or initials).
- [ ] Avatar upload to R2; client caches images on disk.
- [ ] Settings → Following checklist (reads/writes `/me/follows`; other Macs get a `follows` push); auto-follow: redeeming an invite makes the inviter follow the new member; menu bar prefs; notification prefs; shortcut remapping (KeyboardShortcuts recorder).
- [ ] Presence: client pings every 30 s; DO alarm marks offline after 10 min; red lights still shown when offline.
- **Done when:** a brand-new Mac can join from an emailed link with zero terminal use.

### Phase 4 — Release pipeline (1 day, mostly waiting on Apple)
- [ ] Apple Developer ID Application certificate + notarization API key in GitHub secrets.
- [ ] Sparkle: EdDSA keys, `SUFeedURL`, `SUPublicEDKey`, appcast generation.
- [ ] `build-release.sh`: `xcodebuild archive` → `codesign --options runtime` → `create-dmg` → `notarytool submit --wait` → `stapler` → `sign_update` → upload.
- [ ] `release.yml` on tag `v*`: runs the above, creates GitHub Release, uploads appcast to R2, opens PR on `homebrew-tap` with new version/sha.
- [ ] `homebrew/andon.rb` cask.
- [ ] Download page at `/download` on the Worker redirecting to latest dmg.
- **Done when:** `git tag v0.1.0 && git push --tags` produces a dmg that opens with no Gatekeeper warning on a Mac that has never seen it.

### Phase 5 — Observability (later)
- [ ] `/team/events` CSV export; a simple `/admin/stats` page: time-to-ack, time-to-resolve, pulls per week per person.
- [ ] `/api/pull` for CI with a synthetic member per pipeline.
- [ ] Optional team setting: amber auto-prompts "escalate to red?" after N minutes.

---

## 7. Key implementation notes

**Menu bar colour.** Never set `isTemplate = true` on the status image.
Render into an `NSImage` with `NSImage(size:flipped:drawingHandler:)` so it
redraws correctly at Retina scale. Width: `statusItem.length = 40` with own
light, `20` without. Use `NSStatusItem.button?.image`; SwiftUI `MenuBarExtra`
is avoided because it flattens images to monochrome.

**Hotkeys.** `sindresorhus/KeyboardShortcuts` — global, remappable, no
Accessibility permission needed. Define `KeyboardShortcuts.Name` for
`pullGreen, pullAmber, pullRed, pullAmberWithTopic, pullRedWithTopic, ackOldest`.

**Topic prompt window.** `NSPanel` with `.nonactivatingPanel` + `.hudWindow`
style, `level = .floating`, `becomesKeyOnlyIfNeeded = false`. Must take key
focus even though the app is `LSUIElement`; call
`NSApp.activate(ignoringOtherApps: true)` first.

**WebSocket resilience.** Treat the socket as a stream of hints, not truth:
on every (re)connect the server sends a full `hello`, and the client replaces
its state wholesale. Exponential backoff 1 s → 30 s. Also reconnect on
`NSWorkspace.didWakeNotification`.

**Notifications.** Ask permission on first red *received*, not at launch.
Category `ANDON_RED` with actions `ACK` (foreground: false) and `OPEN`.
Thread by `memberId` so repeated pulls stack. The reminder is a local
`UNTimeIntervalNotificationTrigger` with identifier `reminder-<memberId>`,
removed on ack/resolve.

**Durable Object.** Use the WebSocket Hibernation API
(`state.acceptWebSocket`, `webSocketMessage`, `webSocketClose`) so idle teams
cost nothing. Tag each socket with the member id via
`ws.serializeAttachment`. Use `state.storage.sql` for the tables above. Use
`state.storage.setAlarm` for the offline sweep (every 60 s while anyone is
connected).

**Security.** Device tokens hashed with SHA-256 before storage. Invite codes
and login codes: 48 h / 10 min expiry, single use, 5 attempts. Rate-limit
`/auth/code/request` per email (1/min). CORS only needed for the admin page.
Emails sent only to allowed domains.

**Sparkle + sandbox.** Keep the app *not* sandboxed (menu bar utilities
commonly aren't; it avoids XPC complications with Sparkle and the Keychain).
Hardened runtime is still required for notarization.

---

## 8. Running locally

### Prerequisites (developer Mac)
```bash
xcode-select --install
brew install xcodegen create-dmg node
npm i -g wrangler
# Xcode 16+ from the App Store, open once to accept the licence
```

### Backend
```bash
cd backend
npm install
cp .dev.vars.example .dev.vars        # RESEND_API_KEY=..., DEV_MODE=1
npm run dev                            # wrangler dev → http://localhost:8787
./scripts/seed-dev-team.sh             # creates team "dev", admin james, members priya/tom/aisha/marco
```
With `DEV_MODE=1` the worker also accepts `/ws?dev_member=priya` without a
token and logs every event to the console.

### App
```bash
cd app
xcodegen generate
open Andon.xcodeproj
```
Scheme `Andon (dev)` has `ANDON_API_URL=http://localhost:8787` and
`ANDON_DEV_MEMBER=james` as environment variables, so it connects straight
to the local worker as you, with no onboarding.

Run a second instance as a teammate without building twice:
```bash
ANDON_DEV_MEMBER=priya open -n build/Debug/Andon.app
```
Or drive teammates from the terminal:
```bash
npx tsx scripts/fake-member.ts priya red "prod deploy blocked"
npx tsx scripts/fake-member.ts tom amber
npx tsx scripts/fake-member.ts priya green
```

---

## 9. Testing

### Automated (run on every push by `ci.yml`)

**Swift — `xcodebuild test -scheme Andon`**
- `RankingTests`: severity ordering, tie-breaks by age, follow filter, slot limit, offline exclusion, all-green collapse.
- `StatusImageTests`: render with fixtures and sample pixels — own square present/hidden, hollow ring for unacked red, correct width at 1x and 2x.
- `TeamStoreTests`: applying `hello` replaces state; `light` updates one member; ack sets `ackedBy`; resolve clears; reminder scheduled only for red when not Colours-only.
- `RealtimeClientTests`: against an in-process mock WebSocket — reconnect backoff, resync on reconnect, pong on ping.

**Worker — `npm test` (vitest, runs inside workerd via `@cloudflare/vitest-pool-workers`)**
- Auth: invite redeem once only; expired codes; domain allowlist; wrong code attempts cap; token hashing.
- Follows: follow/unfollow persist and push `follows` to the member's other sockets; inviter auto-follows on redeem; `PUT /me/follows` ignores unknown ids.
- DO: pull broadcasts to all sockets; ack by non-follower rejected; second ack ignored and returns first acker; resolve by someone else rejected; `hello` reflects cold-start rebuild from `events`.
- Alarm: member offline after 10 min of no ping; red light survives offline.
- `/api/pull` with bad key → 401.
- `ranking.ts` matches the Swift fixtures (same JSON fixture file in both suites).

### Manual QA checklist (before each release)

Two Macs, A (you) and B (teammate), both on the TestFlight-style build.

1. **Install:** B opens the dmg on a Mac that has never run Andon. No Gatekeeper warning. App appears in the bar, onboarding opens.
2. **Join:** A invites B from `/admin`. B receives email in < 1 min, clicks link, app finishes onboarding. B sets photo by drag-drop; A sees it in the dropdown within 5 s.
3. **Follow:** A invited B, so B is already in A's grid. A unfollows B from the dropdown (right-click) — B's dot disappears; A re-follows from "Everyone else". Log in as A on a second Mac: the same follow list is there.
4. **Instant pull:** B presses `⌃⌥R`. Within 1 s A's grid shows a hollow red ring and A gets a notification with Acknowledge / Open. B's own square pulses.
5. **Ack from notification:** A clicks Acknowledge. Ring fills; B's square stops pulsing; B's dropdown says "A is on it". No second notification arrives at 10 min.
6. **Reminder:** repeat 4 but ignore the notification. A second notification arrives at 10 min (set to 1 min in Settings for testing). Nothing after that.
7. **Topic:** B presses `⌃⌥⇧A`, types "unsure about export API", Enter. A's dropdown shows the amber with the topic; A gets no notification.
8. **Colours only:** A turns it on, B pulls red. A's bar updates; no banner. Turn off again.
9. **Hide own light:** A toggles it. Bar shrinks to the grid only.
10. **Resolve:** B presses `⌃⌥G`, skips the note. A's dot turns green; no notification.
11. **Offline:** B closes the lid for 11 min while red. A still sees the red. B reopens; app reconnects without user action and state is correct.
12. **Sleep/wake:** A sleeps the Mac mid-session; after wake, changes made meanwhile are reflected within 5 s.
13. **New Mac login:** B installs on a second Mac, enters email, receives code, logs in; both Macs stay in sync.
14. **Update:** bump version, tag, release. Running app offers the update via Sparkle, installs, relaunches.
15. **Shortcut remap:** change `⌃⌥R` to something else in Settings; old binding no longer fires, new one does, survives relaunch.

### Load sanity (once)
`scripts/fake-member.ts --storm 50` opens 50 sockets to one team and pulls
randomly for a minute. Expect < 200 ms fan-out and no dropped frames in the
app.

---

## 10. Deploying

### Backend (Cloudflare)
One-time:
```bash
cd backend
wrangler login
wrangler r2 bucket create andon-avatars
wrangler secret put RESEND_API_KEY
wrangler secret put BOOTSTRAP_ADMIN_EMAIL     # your email; first login code goes here
wrangler deploy
```
Then open `https://andon.<your-subdomain>.workers.dev/admin`, log in with the
emailed code, set team name and allowed email domains (e.g. `theodo.co.uk`).

Ongoing: `deploy-backend.yml` runs `wrangler deploy` on every push to `main`
using a `CLOUDFLARE_API_TOKEN` secret. DO migrations are declared in
`wrangler.toml`; schema changes are applied by the DO on first request after
deploy (keep `migrate()` idempotent).

Cost: free tier covers a team comfortably. Resend free tier: 3 000 emails/month.

### App release
One-time (Apple):
1. Apple Developer Program membership (organisation account, £79/yr). Your company may already have one.
2. In Xcode → Settings → Accounts, create a **Developer ID Application** certificate. Export as `.p12`.
3. App Store Connect → Users → Keys → create an API key with Developer access (for `notarytool`). Download the `.p8`.
4. Generate Sparkle keys: `./Pods/Sparkle/bin/generate_keys` (or from the Sparkle release zip). Put the public key in `Info.plist` as `SUPublicEDKey`.
5. GitHub secrets: `APPLE_CERT_P12_BASE64`, `APPLE_CERT_PASSWORD`, `APPLE_TEAM_ID`, `NOTARY_KEY_ID`, `NOTARY_ISSUER_ID`, `NOTARY_KEY_P8_BASE64`, `SPARKLE_PRIVATE_KEY`, `HOMEBREW_TAP_TOKEN`, `CLOUDFLARE_API_TOKEN`.
6. Create the `yourorg/homebrew-tap` repo (empty, with a `Casks/` folder).

Each release:
```bash
# bump MARKETING_VERSION and CURRENT_PROJECT_VERSION in app/project.yml
git commit -am "Release 0.2.0"
git tag v0.2.0
git push && git push --tags
```
`release.yml` then: builds on `macos-latest`, signs with hardened runtime,
packages a dmg, notarizes (`xcrun notarytool submit --wait`), staples, signs
the dmg for Sparkle, creates the GitHub Release with the dmg attached,
regenerates `appcast.xml` and uploads it to R2, and opens a PR on the tap
bumping `version` and `sha256`. Merge that PR.

Verify on a clean Mac:
```bash
spctl -a -vv -t install Andon.dmg        # "accepted, source=Notarized Developer ID"
xcrun stapler validate Andon.app
```

### Installing (what teammates do)
- **Everyone:** open `https://andon.<subdomain>.workers.dev/download`, open the dmg, drag to Applications, open. Paste the invite link or enter work email. Add to Login Items when prompted.
- **Developers, optionally:** `brew install --cask yourorg/tap/andon`.

Updates arrive automatically via Sparkle (checks daily, prompts to install).

---

## 11. Open questions to settle with the team

1. Should amber nudge the developer to escalate to red after N minutes? (Proposed: team-level setting, default off.)
2. Should followers be allowed to *see* a member's history, or only admins? (Proposed: admins only, via `/admin/stats`.)
3. Do we want a Slack mirror later (post reds to a channel) for people away from their Mac? Trivial to add as a DO side-effect; not in scope now.
4. One team per deployment is assumed. Multi-team on one Worker is supported by the DO design but the admin page would need a team switcher.
