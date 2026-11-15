import * as Popover from "@radix-ui/react-popover";
import { CalendarClock, Check } from "lucide-react";
import { useState, type ChangeEvent, type ReactElement } from "react";

import { TIME_RANGE_PRESETS, type TimeRangePreset } from "../domain/timeRange.constants.js";
import { describeWindow, fromDateTimeInput, toDateTimeInput, type TimeRange, type TimeWindow } from "../domain/timeRange.js";

type TimeRangePickerProps = {
  readonly window: TimeWindow;
  /** The window as it resolves now, to start the custom fields from. */
  readonly range: TimeRange;
  readonly onChange: (window: TimeWindow) => void;
};

/** Presets first (they follow the clock), then any start and end you like. */
export const TimeRangePicker = ({ window, range, onChange }: TimeRangePickerProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [from, setFrom] = useState(() => toDateTimeInput(range.from));
  const [to, setTo] = useState(() => toDateTimeInput(range.to));
  const customRange = toRange(from, to);
  const choose = (chosen: TimeWindow): void => {
    onChange(chosen);
    setIsOpen(false);
  };
  const handleOpenChange = (willOpen: boolean): void => {
    if (willOpen) {
      setFrom(toDateTimeInput(range.from));
      setTo(toDateTimeInput(range.to));
    }
    setIsOpen(willOpen);
  };
  const handleFrom = (event: ChangeEvent<HTMLInputElement>): void => setFrom(event.target.value);
  const handleTo = (event: ChangeEvent<HTMLInputElement>): void => setTo(event.target.value);
  const applyCustom = (): void => {
    if (customRange === null) return;
    choose({ kind: "custom", range: customRange });
  };
  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-sm hover:bg-surface-sunken">
        <CalendarClock size={15} className="text-ink-muted" />
        {describeWindow(window)}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-80 rounded-lg border border-border bg-surface-raised p-1 shadow-lg">
          {TIME_RANGE_PRESETS.map((preset) => (
            <PresetRow key={preset.id} preset={preset} isSelected={window.kind === "preset" && window.preset === preset.id} onChoose={choose} />
          ))}
          <div className="mt-1 border-t border-border p-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">Custom</p>
            <label className="mb-2 flex items-center justify-between gap-2 text-sm">
              From
              <input type="datetime-local" value={from} onChange={handleFrom} className="h-8 rounded-md border border-border bg-surface px-2 text-sm" />
            </label>
            <label className="mb-3 flex items-center justify-between gap-2 text-sm">
              To
              <input type="datetime-local" value={to} onChange={handleTo} className="h-8 rounded-md border border-border bg-surface px-2 text-sm" />
            </label>
            <button type="button" disabled={customRange === null} onClick={applyCustom} className="h-8 w-full rounded-md bg-ink text-sm font-medium text-surface disabled:opacity-40">
              Show this range
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

type PresetRowProps = {
  readonly preset: TimeRangePreset;
  readonly isSelected: boolean;
  readonly onChoose: (window: TimeWindow) => void;
};

const PresetRow = ({ preset, isSelected, onChoose }: PresetRowProps): ReactElement => {
  const handleChoose = (): void => onChoose({ kind: "preset", preset: preset.id });
  return (
    <button type="button" onClick={handleChoose} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-surface-sunken">
      <span className={isSelected ? "font-semibold" : ""}>{preset.label}</span>
      {isSelected && <Check size={16} strokeWidth={3} />}
    </button>
  );
};

/** Null until both ends are filled in and the end is after the start. */
const toRange = (from: string, to: string): TimeRange | null => {
  const start = fromDateTimeInput(from);
  const end = fromDateTimeInput(to);
  const isComplete = start !== null && end !== null && end > start;
  if (!isComplete) return null;
  return { from: start, to: end };
};
