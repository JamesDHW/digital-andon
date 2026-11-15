import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

type HintProps = {
  readonly content: ReactNode;
  readonly children: ReactElement;
};

/** A small tooltip on hover or keyboard focus. Needs a Tooltip.Provider above it (the app shell has one). */
export const Hint = ({ content, children }: HintProps): ReactElement => (
  <Tooltip.Root delayDuration={120}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content sideOffset={8} className="z-50 max-w-72 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink shadow-lg">
        {content}
        <Tooltip.Arrow className="fill-surface-raised" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

export const HintProvider = Tooltip.Provider;
