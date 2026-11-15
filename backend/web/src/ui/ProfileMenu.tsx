import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut } from "lucide-react";
import type { ReactElement } from "react";

import type { Light } from "@backend/domain/light.js";
import type { Member } from "@backend/domain/member.js";
import { Avatar } from "./Avatar.js";

type ProfileMenuProps = {
  readonly you: Member;
  readonly yourLight: Light | null;
  readonly onSignOut: () => void;
};

/** Your photo, ringed in your own light, opening your name, email and Sign out. */
export const ProfileMenu = ({ you, yourLight, onSignOut }: ProfileMenuProps): ReactElement => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger className="rounded-full outline-offset-4" aria-label="Your profile">
      <Avatar member={you} colour={yourLight?.colour ?? null} size={34} isBreathing={false} isFaded={false} />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-60 rounded-lg border border-border bg-surface-raised p-1 shadow-lg">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar member={you} colour={null} size={36} isBreathing={false} isFaded={false} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{you.name}</p>
            <p className="truncate text-xs text-ink-muted">{you.email}</p>
          </div>
        </div>
        <DropdownMenu.Separator className="my-1 h-px bg-border" />
        <DropdownMenu.Item onSelect={onSignOut} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface-sunken">
          <LogOut size={15} />
          Sign out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);
