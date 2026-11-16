import { ChartLine, Download, Settings, Shuffle, Users } from "lucide-react";
import type { MouseEvent, ReactElement, ReactNode } from "react";

import type { Light } from "@backend/domain/light.js";
import type { Member } from "@backend/domain/member.js";
import { Logo } from "./Logo.js";
import { ProfileMenu } from "./ProfileMenu.js";

type AppShellProps = {
  readonly path: string;
  readonly navigate: (href: string) => void;
  readonly teamName: string | null;
  readonly you: Member | null;
  readonly yourLight: Light | null;
  readonly onSignOut: () => void;
  readonly children: ReactNode;
};

/** A navbar across the top (logo, team, your profile) and a sidebar of sections, like a deployment dashboard. */
export const AppShell = ({ path, navigate, teamName, you, yourLight, onSignOut, children }: AppShellProps): ReactElement => {
  const isAdmin = you?.role === "admin";
  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>): void => followLink(event, navigate);
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-raised px-4">
        <a href="/team" onClick={handleHomeClick} className="flex items-center gap-3">
          <Logo height={18} />
          <span className="font-semibold tracking-tight">Digital Andon</span>
          {teamName !== null && <span className="text-ink-muted">/ {teamName}</span>}
        </a>
        {you !== null && <ProfileMenu you={you} yourLight={yourLight} onSignOut={onSignOut} />}
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="w-56 shrink-0 border-r border-border bg-surface-raised p-3" aria-label="Sections">
          <NavItem href="/team" path={path} navigate={navigate} icon={<Users size={16} />} label="Team" />
          <NavItem href="/timeline" path={path} navigate={navigate} icon={<ChartLine size={16} />} label="Timeline" />
          <NavItem href="/switching" path={path} navigate={navigate} icon={<Shuffle size={16} />} label="Context switching" />
          {isAdmin && (
            <>
              <p className="mt-6 mb-1 px-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">Admin</p>
              <NavItem href="/export" path={path} navigate={navigate} icon={<Download size={16} />} label="Export" />
              <NavItem href="/settings" path={path} navigate={navigate} icon={<Settings size={16} />} label="Settings" />
            </>
          )}
        </nav>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

type NavItemProps = {
  readonly href: string;
  readonly path: string;
  readonly navigate: (href: string) => void;
  readonly icon: ReactNode;
  readonly label: string;
};

const NavItem = ({ href, path, navigate, icon, label }: NavItemProps): ReactElement => {
  const isCurrent = path === href;
  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => followLink(event, navigate);
  return (
    <a
      href={href}
      onClick={handleClick}
      aria-current={isCurrent ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${isCurrent ? "bg-surface-sunken font-medium text-ink" : "text-ink-secondary hover:bg-surface-sunken hover:text-ink"}`}
    >
      {icon}
      {label}
    </a>
  );
};

/** Plain clicks stay in the app; ⌘-click and middle-click still open a new tab. */
export const followLink = (event: MouseEvent<HTMLAnchorElement>, navigate: (href: string) => void): void => {
  const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0;
  if (isModified) return;
  event.preventDefault();
  navigate(event.currentTarget.getAttribute("href") ?? "/");
};
