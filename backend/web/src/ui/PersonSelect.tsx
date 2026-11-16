import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { useState, type ReactElement } from "react";

import type { Member } from "@backend/domain/member.js";
import type { MemberId } from "@backend/domain/memberId.js";
import { Avatar } from "./Avatar.js";

type PersonSelectProps = {
  readonly members: readonly Member[];
  readonly selected: MemberId;
  readonly onChange: (memberId: MemberId) => void;
};

/** Choose one person by face and name. */
export const PersonSelect = ({ members, selected, onChange }: PersonSelectProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const chosen = members.find((member) => member.id === selected) ?? null;
  const sorted = members.toSorted((first, second) => first.name.localeCompare(second.name));
  const choose = (memberId: MemberId): void => {
    setIsOpen(false);
    onChange(memberId);
  };
  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-sm hover:bg-surface-sunken">
        {chosen !== null && <Avatar member={chosen} colour={null} size={20} isBreathing={false} isFaded={false} />}
        <span>{chosen?.name ?? "Choose someone"}</span>
        <ChevronDown size={14} className="text-ink-muted" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-64 rounded-lg border border-border bg-surface-raised p-2 shadow-lg">
          <ul className="max-h-80 overflow-auto" role="listbox">
            {sorted.map((member) => (
              <PersonOption key={member.id} member={member} isSelected={member.id === selected} onChoose={choose} />
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
  readonly onChoose: (memberId: MemberId) => void;
};

const PersonOption = ({ member, isSelected, onChoose }: PersonOptionProps): ReactElement => {
  const handleChoose = (): void => onChoose(member.id);
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={handleChoose}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-sunken"
      >
        <Avatar member={member} colour={null} size={24} isBreathing={false} isFaded={false} />
        <span className="flex-1 truncate">{member.name}</span>
        {isSelected && <Check size={16} strokeWidth={3} />}
      </button>
    </li>
  );
};
