import { useEffect, type ReactElement } from "react";

import { useNow } from "../hooks/useNow.js";
import { useRoute, type Route } from "../hooks/useRoute.js";
import { useSession } from "../hooks/useSession.js";
import { useSnapshot } from "../hooks/useSnapshot.js";
import { memberById, type TeamSnapshot } from "../domain/board.js";
import { AppShell } from "../ui/AppShell.js";
import { HintProvider } from "../ui/Hint.js";
import { ExportPage } from "./ExportPage.js";
import { SettingsPage } from "./SettingsPage.js";
import { SignInPage } from "./SignInPage.js";
import { TeamPage } from "./TeamPage.js";
import { TimelinePage } from "./TimelinePage.js";

export const App = (): ReactElement => {
  const session = useSession();
  const route = useRoute();
  if (session.token === null) return <SignInPage problem={session.signInError} />;
  return (
    <HintProvider>
      <SignedIn token={session.token} route={route} onSignOut={session.signOut} />
    </HintProvider>
  );
};

type SignedInProps = {
  readonly token: string;
  readonly route: Route;
  readonly onSignOut: () => void;
};

const SignedIn = ({ token, route, onSignOut }: SignedInProps): ReactElement => {
  const { snapshot, problem } = useSnapshot(token, onSignOut);
  const now = useNow(1000);
  const you = snapshot === null ? null : memberById(snapshot.members, snapshot.you);
  const yourLight = snapshot?.lights.find((light) => light.memberId === snapshot.you) ?? null;
  const isHome = route.path === "/";
  useEffect(() => {
    if (isHome) {
      route.navigate("/team");
    }
  }, [isHome, route]);
  return (
    <AppShell path={route.path} navigate={route.navigate} teamName={snapshot?.teamName ?? null} you={you} yourLight={yourLight} onSignOut={onSignOut}>
      {problem !== null && <p className="border-b border-border bg-surface-sunken px-6 py-2 text-sm text-ink-secondary">{problem}</p>}
      {snapshot === null && <p className="p-6 text-ink-muted">Loading…</p>}
      {snapshot !== null && <Page token={token} route={route} snapshot={snapshot} now={now} isAdmin={you?.role === "admin"} onSignOut={onSignOut} />}
    </AppShell>
  );
};

type PageProps = {
  readonly token: string;
  readonly route: Route;
  readonly snapshot: TeamSnapshot;
  readonly now: number;
  readonly isAdmin: boolean;
  readonly onSignOut: () => void;
};

const Page = ({ token, route, snapshot, now, isAdmin, onSignOut }: PageProps): ReactElement => {
  switch (route.path) {
    case "/":
    case "/team":
      return <TeamPage snapshot={snapshot} now={now} navigate={route.navigate} />;
    case "/timeline":
      return <TimelinePage token={token} route={route} snapshot={snapshot} onSignedOut={onSignOut} />;
    case "/export":
      if (!isAdmin) return <AdminsOnly />;
      return <ExportPage token={token} snapshot={snapshot} onSignedOut={onSignOut} />;
    case "/settings":
      if (!isAdmin) return <AdminsOnly />;
      return <SettingsPage token={token} snapshot={snapshot} onSignedOut={onSignOut} />;
    default:
      return <p className="p-6 text-ink-secondary">There's no page here.</p>;
  }
};

const AdminsOnly = (): ReactElement => <p className="p-6 text-ink-secondary">Only team admins can see this page.</p>;
