import type { ReactElement } from "react";

import type { Member } from "@backend/domain/member.js";
import type { MemberId } from "@backend/domain/memberId.js";
import { laneY, type ChartLayout } from "../domain/chartLayout.js";
import { formatMoment } from "../domain/format.js";
import { segmentAt, type JoinMark, type PersonTimeline } from "../domain/timeline.js";
import { Avatar } from "./Avatar.js";
import { Hint } from "./Hint.js";
import { JOIN_MARK_SIZE } from "./ui.constants.js";

type JoinMarksProps = {
  readonly timeline: PersonTimeline;
  readonly layout: ChartLayout;
  readonly lane: number;
  readonly laneCount: number;
  readonly memberOf: (memberId: MemberId) => Member | null;
};

/** A helper's face on the person's line where they joined; dimmed where they left. A leave before the line drops out
 * of red shows someone left before the person was unblocked. */
export const JoinMarks = ({ timeline, layout, lane, laneCount, memberOf }: JoinMarksProps): ReactElement => (
  <>
    {timeline.marks.map((mark, index) => (
      <Mark key={`${mark.helperId}-${String(mark.at)}-${mark.kind}`} mark={mark} index={index} timeline={timeline} layout={layout} lane={lane} laneCount={laneCount} memberOf={memberOf} />
    ))}
  </>
);

type MarkProps = JoinMarksProps & {
  readonly mark: JoinMark;
  readonly index: number;
};

const Mark = ({ mark, index, timeline, layout, lane, laneCount, memberOf }: MarkProps): ReactElement | null => {
  const helper = memberOf(mark.helperId);
  if (helper === null) return null;
  const segment = segmentAt(timeline, mark.at) ?? timeline.segments.at(-1) ?? null;
  if (segment === null) return null;
  const isLeave = mark.kind === "leave";
  const nudge = isLeave ? -JOIN_MARK_SIZE / 2 : 0;
  const left = layout.x(mark.at) - JOIN_MARK_SIZE / 2 + nudge;
  const top = laneY(layout, segment.colour, lane, laneCount) - JOIN_MARK_SIZE - 3;
  return (
    <Hint content={`${helper.name} ${isLeave ? "left" : "joined"} · ${formatMoment(mark.at)}`}>
      <span className="absolute rounded-full" style={{ left, top, zIndex: 3 + index }}>
        <Avatar member={helper} colour={null} size={JOIN_MARK_SIZE} isBreathing={false} isFaded={isLeave} />
      </span>
    </Hint>
  );
};
