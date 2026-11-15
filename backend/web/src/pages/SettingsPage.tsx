import { useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";

import type { Member } from "@backend/domain/member.js";
import { useTeamSettings } from "../hooks/useTeamSettings.js";
import type { TeamSnapshot } from "../domain/board.js";
import { Avatar } from "../ui/Avatar.js";

type SettingsPageProps = {
  readonly token: string;
  readonly snapshot: TeamSnapshot;
  readonly onSignedOut: () => void;
};

/** Who can join, and who is on the team. */
export const SettingsPage = ({ token, snapshot, onSignedOut }: SettingsPageProps): ReactElement => {
  const { settings, message, save, remove } = useTeamSettings(token, onSignedOut);
  return (
    <div className="max-w-3xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      {message !== null && <p className="mt-3 text-sm text-ink-secondary">{message}</p>}
      {settings !== null && <TeamForm key={settings.teamName + settings.allowedDomains.join(",")} teamName={settings.teamName} allowedDomains={settings.allowedDomains} onSave={save} />}
      <h2 className="mt-10 mb-3 text-lg font-semibold">Members</h2>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface-raised">
        {snapshot.members.toSorted((first, second) => first.name.localeCompare(second.name)).map((member) => (
          <MemberRow key={member.id} member={member} isYou={member.id === snapshot.you} onRemove={remove} />
        ))}
      </ul>
    </div>
  );
};

type TeamFormProps = {
  readonly teamName: string;
  readonly allowedDomains: readonly string[];
  readonly onSave: (settings: { readonly teamName: string; readonly allowedDomains: string[] }) => void;
};

const TeamForm = ({ teamName, allowedDomains, onSave }: TeamFormProps): ReactElement => {
  const [name, setName] = useState(teamName);
  const [domains, setDomains] = useState(allowedDomains.join(", "));
  const handleName = (event: ChangeEvent<HTMLInputElement>): void => setName(event.target.value);
  const handleDomains = (event: ChangeEvent<HTMLInputElement>): void => setDomains(event.target.value);
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSave({ teamName: name, allowedDomains: domains.split(",").map((domain) => domain.trim()).filter((domain) => domain.length > 0) });
  };
  return (
    <form className="mt-6 space-y-4 rounded-lg border border-border bg-surface-raised p-5" onSubmit={handleSubmit}>
      <label className="block text-sm">
        <span className="text-ink-secondary">Team name</span>
        <input value={name} onChange={handleName} required className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3" />
      </label>
      <label className="block text-sm">
        <span className="text-ink-secondary">Allowed email domains</span>
        <input value={domains} onChange={handleDomains} placeholder="company.com, company.co.uk" className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3" />
        <span className="mt-1 block text-xs text-ink-muted">Anyone with a Google account on these domains can join on their own. Leave it empty and nobody new can join.</span>
      </label>
      <button type="submit" className="h-9 rounded-md bg-ink px-4 text-sm font-medium text-surface">
        Save
      </button>
    </form>
  );
};

type MemberRowProps = {
  readonly member: Member;
  readonly isYou: boolean;
  readonly onRemove: (memberId: Member["id"]) => void;
};

const MemberRow = ({ member, isYou, onRemove }: MemberRowProps): ReactElement => {
  const confirmRemove = (): void => {
    const isConfirmed = window.confirm(`Remove ${member.name}? Their Macs are signed out. They can join again with Google.`);
    if (isConfirmed) {
      onRemove(member.id);
    }
  };
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Avatar member={member} colour={null} size={32} isBreathing={false} isFaded={false} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {member.name}
          {isYou && <span className="font-normal text-ink-muted"> (you)</span>}
        </p>
        <p className="truncate text-xs text-ink-muted">{member.email}</p>
      </div>
      <span className="text-xs text-ink-muted">{member.role === "admin" ? "Admin" : "Member"}</span>
      {!isYou && (
        <button type="button" onClick={confirmRemove} className="text-sm text-ink-secondary hover:text-ink">
          Remove
        </button>
      )}
    </li>
  );
};
