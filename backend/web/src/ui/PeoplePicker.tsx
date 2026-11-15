import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { useState, type ChangeEvent, type ReactElement } from "react";

import type { Member } from "@backend/domain/member.js";
import type { MemberId } from "@backend/domain/memberId.js";
import { Avatar } from "./Avatar.js";

type PeoplePickerProps = {
  readonly members: readonly Member[];
  readonly selected: readonly MemberId[];
  /** Offered as a one-click choice: the people you follow in the Mac app. */
  readonly follows: readonly MemberId[];
  readonly onChange: (selected: readonly MemberId[]) => void;
};

/** Pick any number of people by face and name, with shortcuts for the people you follow, everyone and nobody. */
export const PeoplePicker = ({ members, selected, follows, onChange }: PeoplePickerProps): ReactElement => {
  const [search, setSearch] = useState("");
  const chosen = members.filter((member) => selected.includes(member.id));
  const query = search.trim().toLowerCase();
  const matching = members.filter((member) => member.name.toLowerCase().includes(query)).toSorted((first, second) => first.name.localeCompare(second.name));
  const handleSearch = (event: ChangeEvent<HTMLInputElement>): void => setSearch(event.target.value);
  const chooseFollowing = (): void => onChange(follows);
  const chooseEveryone = (): void => onChange(members.map((member) => member.id));
  const chooseNobody = (): void => onChange([]);
  const toggle = (memberId: MemberId): void => {
    const isSelected = selected.includes(memberId);
    onChange(isSelected ? selected.filter((id) => id !== memberId) : [...selected, memberId]);
  };
  return (
    <Popover.Root>
      <Popover.Trigger className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-sm hover:bg-surface-sunken">
        <span className="flex -space-x-1.5">
          {chosen.slice(0, 5).map((member) => (
            <span key={member.id} className="rounded-full ring-2 ring-surface-raised">
              <Avatar member={member} colour={null} size={20} isBreathing={false} isFaded={false} />
            </span>
          ))}
        </span>
        <span>{describeSelection(chosen, members.length)}</span>
        <ChevronDown size={14} className="text-ink-muted" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-72 rounded-lg border border-border bg-surface-raised p-2 shadow-lg">
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search people"
            className="mb-2 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-ink-muted"
          />
          <div className="mb-2 flex gap-1 text-xs">
            <QuickChoice label="Following" onClick={chooseFollowing} />
            <QuickChoice label="Everyone" onClick={chooseEveryone} />
            <QuickChoice label="Nobody" onClick={chooseNobody} />
          </div>
          <ul className="max-h-72 overflow-auto" role="listbox" aria-multiselectable="true">
            {matching.map((member) => (
              <PersonOption key={member.id} member={member} isSelected={selected.includes(member.id)} onToggle={toggle} />
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

type PersonOptionProps = {
  readonly member: Member;
  readonly isSelected: boolean;
  readonly onToggle: (memberId: MemberId) => void;
};

const PersonOption = ({ member, isSelected, onToggle }: PersonOptionProps): ReactElement => {
  const handleToggle = (): void => onToggle(member.id);
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={handleToggle}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-sunken"
      >
        <Avatar member={member} colour={null} size={24} isBreathing={false} isFaded={false} />
        <span className="flex-1 truncate">{member.name}</span>
        {isSelected && <Check size={16} strokeWidth={3} />}
      </button>
    </li>
  );
};

type QuickChoiceProps = {
  readonly label: string;
  readonly onClick: () => void;
};

const QuickChoice = ({ label, onClick }: QuickChoiceProps): ReactElement => (
  <button type="button" onClick={onClick} className="rounded-md border border-border px-2 py-1 text-ink-secondary hover:bg-surface-sunken hover:text-ink">
    {label}
  </button>
);

const describeSelection = (chosen: readonly Member[], total: number): string => {
  switch (chosen.length) {
    case 0:
      return "Nobody";
    case total:
      return "Everyone";
    case 1:
      return chosen[0]?.name ?? "1 person";
    default:
      return `${chosen.length} people`;
  }
};
