"use strict";

const TOKEN_KEY = "andon.adminToken";
const DAY_MS = 24 * 60 * 60 * 1000;
const STATS_WINDOW_DAYS = 28;

const element = (id) => document.getElementById(id);

const readToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
const writeToken = (token) => {
  try { token === null ? localStorage.removeItem(TOKEN_KEY) : localStorage.setItem(TOKEN_KEY, token); } catch { /* private window: stay signed in for this tab only */ }
};

const session = { token: readToken(), pendingEmail: "", members: [] };

const api = async (method, path, body) => {
  const headers = { "content-type": "application/json" };
  if (session.token !== null) headers.authorization = `Bearer ${session.token}`;
  const response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 401) signOut();
  if (!response.ok) {
    const failure = await response.json().catch(() => ({ message: `Request failed (${response.status}).` }));
    throw new Error(failure.message);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("json") ? response.json() : response.text();
};

const showMessage = (id, text, isError = false) => {
  const target = element(id);
  target.textContent = text;
  target.classList.toggle("error", isError);
};

const signOut = () => {
  session.token = null;
  writeToken(null);
  element("console").hidden = true;
  element("sign-out").hidden = true;
  element("sign-in").hidden = false;
};

const showConsole = async () => {
  element("sign-in").hidden = true;
  element("console").hidden = false;
  element("sign-out").hidden = false;
  try {
    await Promise.all([loadMembers(), loadSettings(), loadStats()]);
  } catch (failure) {
    showMessage("console-message", failure.message, true);
  }
};

const loadMembers = async () => {
  const { members } = await api("GET", "/team/members");
  session.members = members;
  const rows = members.map((member) => {
    const row = document.createElement("tr");
    for (const text of [member.name, member.email, member.role]) {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.append(cell);
    }
    const actionCell = document.createElement("td");
    if (member.role !== "admin") {
      const remove = document.createElement("button");
      remove.className = "danger";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => removeMember(member));
      actionCell.append(remove);
    }
    row.append(actionCell);
    return row;
  });
  element("members").replaceChildren(...rows);
};

const removeMember = async (member) => {
  if (!window.confirm(`Remove ${member.name}? Their Macs will be signed out.`)) return;
  try {
    await api("DELETE", `/team/members/${encodeURIComponent(member.id)}`);
    await loadMembers();
  } catch (failure) {
    showMessage("console-message", failure.message, true);
  }
};

const loadSettings = async () => {
  const settings = await api("GET", "/team/settings");
  element("team-name").value = settings.teamName;
  element("domains").value = settings.allowedDomains.join(", ");
};

const median = (values) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const formatDuration = (milliseconds) => {
  if (milliseconds === null) return "–";
  const minutes = Math.round(milliseconds / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${(minutes / 60).toFixed(1)} h`;
};

const loadStats = async () => {
  const { events } = await api("GET", "/team/events?limit=5000");
  const since = Date.now() - STATS_WINDOW_DAYS * DAY_MS;
  const recent = events.filter((event) => event.at >= since);
  const pulls = recent.filter((event) => event.kind === "pull");
  const isRaised = (colour) => colour === "amber" || colour === "red";
  const redSince = new Map();
  const raisedSince = new Map();
  const timesInRed = [];
  const timesToUnblock = [];
  for (const event of pulls) {
    if (redSince.has(event.memberId) && event.colour !== "red") {
      timesInRed.push(event.at - redSince.get(event.memberId));
      redSince.delete(event.memberId);
    }
    if (event.colour === "red" && !redSince.has(event.memberId)) redSince.set(event.memberId, event.at);
    if (isRaised(event.colour) && !raisedSince.has(event.memberId)) raisedSince.set(event.memberId, event.at);
    if (!isRaised(event.colour) && raisedSince.has(event.memberId)) {
      timesToUnblock.push(event.at - raisedSince.get(event.memberId));
      raisedSince.delete(event.memberId);
    }
  }
  const stats = [
    ["Red pulls", String(pulls.filter((event) => event.colour === "red").length)],
    ["Amber pulls", String(pulls.filter((event) => event.colour === "amber").length)],
    ["Median time red (until help arrives)", formatDuration(median(timesInRed))],
    ["Median time to unblock", formatDuration(median(timesToUnblock))],
  ];
  element("stats").replaceChildren(...stats.map(([label, value]) => {
    const stat = document.createElement("div");
    stat.className = "stat";
    const caption = document.createElement("span");
    caption.textContent = `${label} · ${STATS_WINDOW_DAYS} days`;
    const figure = document.createElement("strong");
    figure.textContent = value;
    stat.append(caption, figure);
    return stat;
  }));
};

/** Admins see the console; everyone else is pointed at the app. */
const finishSignIn = async (token) => {
  session.token = token;
  writeToken(token);
  const me = await api("GET", "/me");
  if (me.role !== "admin") {
    signOut();
    showMessage("sign-in-message", "You're signed up. This page is for team admins: use the Digital Andon app on your Mac.", true);
    return;
  }
  showMessage("sign-in-message", "");
  await showConsole();
};

/** Google sign-in comes back as /admin/#token=… (or #error=…). The fragment never reaches a server; clear it at once. */
const takeGoogleResult = () => {
  const result = new URLSearchParams(location.hash.slice(1));
  if (!result.has("token") && !result.has("error")) return null;
  history.replaceState(null, "", location.pathname);
  return { token: result.get("token"), error: result.get("error") };
};

element("email-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  session.pendingEmail = element("email").value.trim();
  try {
    await api("POST", "/auth/code/request", { email: session.pendingEmail });
    element("code-form").hidden = false;
    element("code").focus();
    showMessage("sign-in-message", "If that address is on the team, a code is on its way.");
  } catch (failure) {
    showMessage("sign-in-message", failure.message, true);
  }
});

element("code-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const device = await api("POST", "/auth/code/verify", { email: session.pendingEmail, code: element("code").value, deviceName: "Admin page" });
    await finishSignIn(device.deviceToken);
  } catch (failure) {
    showMessage("sign-in-message", failure.message, true);
  }
});

element("invite-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const invite = await api("POST", "/auth/invite", { name: element("invite-name").value, email: element("invite-email").value });
    element("invite-result").hidden = false;
    element("invite-link").value = invite.joinLink;
    element("invite-message").textContent = invite.isEmailSent
      ? "Invite emailed. You can also send this link yourself; it works once, for 48 hours."
      : "The email couldn't be sent. Send this link yourself; it works once, for 48 hours.";
    element("invite-form").reset();
  } catch (failure) {
    showMessage("console-message", failure.message, true);
  }
});

element("copy-link").addEventListener("click", async () => {
  await navigator.clipboard.writeText(element("invite-link").value);
  element("copy-link").textContent = "Copied";
});

element("settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const allowedDomains = element("domains").value.split(",").map((domain) => domain.trim()).filter((domain) => domain.length > 0);
  try {
    await api("PATCH", "/team/settings", { teamName: element("team-name").value, allowedDomains });
    showMessage("console-message", "Settings saved.");
  } catch (failure) {
    showMessage("console-message", failure.message, true);
  }
});

element("download-csv").addEventListener("click", async () => {
  try {
    const csv = await api("GET", "/team/events?format=csv&limit=5000");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "andon-events.csv";
    link.click();
  } catch (failure) {
    showMessage("console-message", failure.message, true);
  }
});

element("sign-out").addEventListener("click", signOut);

const googleResult = takeGoogleResult();
if (googleResult?.error) showMessage("sign-in-message", googleResult.error, true);
if (googleResult?.token) {
  finishSignIn(googleResult.token).catch((failure) => showMessage("sign-in-message", failure.message, true));
}
if (!googleResult?.token && session.token !== null) showConsole();
