import { useState, type ReactElement, type ReactNode } from "react";

import { AndonError, UnauthorisedError } from "@backend/errors/andonError.js";
import type { MemberId } from "@backend/domain/memberId.js";
import { fetchEventsCsv, saveTextFile } from "../api/teamApi.js";
import type { TeamSnapshot } from "../domain/board.js";
import { resolveWindow, type TimeWindow } from "../domain/timeRange.js";
import { PeoplePicker } from "../ui/PeoplePicker.js";
import { TimeRangePicker } from "../ui/TimeRangePicker.js";

type ExportPageProps = {
  readonly token: string;
  readonly snapshot: TeamSnapshot;
  readonly onSignedOut: () => void;
};

/** Every change of light and context, and every join, as a CSV, narrowed to the people and window you choose. */
export const ExportPage = ({ token, snapshot, onSignedOut }: ExportPageProps): ReactElement => {
  const everyone = snapshot.members.map((member) => member.id);
  const [people, setPeople] = useState<readonly MemberId[]>(everyone);
  const [window, setWindow] = useState<TimeWindow>({ kind: "preset", preset: "30d" });
  const [message, setMessage] = useState<string | null>(null);
  const range = resolveWindow(window, Date.now());
  const isEveryone = people.length === everyone.length;
  const download = async (): Promise<void> => {
    setMessage("Preparing…");
    const csv = await fetchEventsCsv(token, { range: resolveWindow(window, Date.now()), memberIds: isEveryone ? null : people });
    if (csv instanceof UnauthorisedError) return onSignedOut();
    if (csv instanceof AndonError) return setMessage(csv.message);
    const rows = Math.max(0, csv.split("\n").length - 1);
    saveTextFile(`digital-andon-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
    setMessage(`Downloaded ${rows} ${rows === 1 ? "change" : "changes"}.`);
  };
  const handleDownload = (): void => void download();
  return (
    <div className="max-w-2xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Export</h1>
      <p className="mt-2 text-sm text-ink-secondary">Every change of light and context, and every time someone joined or left someone, one row each, with who and when. Up to 5,000 rows per file.</p>
      <div className="mt-6 space-y-4 rounded-lg border border-border bg-surface-raised p-5">
        <Field label="People">
          <PeoplePicker members={snapshot.members} selected={people} follows={snapshot.follows} onChange={setPeople} />
        </Field>
        <Field label="Time">
          <TimeRangePicker window={window} range={range} onChange={setWindow} />
        </Field>
        <div className="flex items-center gap-3 pt-2">
          <button type="button" disabled={people.length === 0} onClick={handleDownload} className="h-9 rounded-md bg-ink px-4 text-sm font-medium text-surface disabled:opacity-40">
            Download CSV
          </button>
          {message !== null && <p className="text-sm text-ink-secondary">{message}</p>}
        </div>
      </div>
    </div>
  );
};

type FieldProps = {
  readonly label: string;
  readonly children: ReactNode;
};

const Field = ({ label, children }: FieldProps): ReactElement => (
  <div className="flex items-center gap-4">
    <span className="w-16 text-sm text-ink-secondary">{label}</span>
    {children}
  </div>
);
