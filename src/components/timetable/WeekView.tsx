import Icon from "@/components/ui/Icon";
import { MODULE_STYLES } from "@/components/ui/module-color";
import { shortLabel } from "@/lib/class-types";
import { clashingIndexes } from "@/lib/clash";
import { venueLabel } from "@/lib/format";
import type { PlannedSession } from "@/lib/plan";
import { DAY_SHORT, toMinutes } from "@/lib/time";
import { assignOverlapLanes } from "@/lib/timetable";

const HOUR_HEIGHT = 40;
const AXIS_WIDTH = 2.25; // rem
const MIN_DAY_WIDTH = 3.6; // rem; Mon–Fri fit a 360 px screen when nothing clashes
const MIN_CLASH_LANE_WIDTH = 4.25; // rem, including the clash border around Micro labels
const LONG_CODE_LENGTH = 8; // module codes this long don't fit MIN_DAY_WIDTH
const LONG_CODE_DAY_WIDTH = 4.5; // rem for an 8-character code
const EXTRA_CHARACTER_WIDTH = 0.5; // rem for each character beyond that

/** A day is only as wide as its longest module code needs, so other weeks stay compact. */
function dayWidthFor(codes: string[]): number {
  const longest = Math.max(0, ...codes.map((code) => code.length));
  if (longest < LONG_CODE_LENGTH) return MIN_DAY_WIDTH;
  return LONG_CODE_DAY_WIDTH + (longest - LONG_CODE_LENGTH) * EXTRA_CHARACTER_WIDTH;
}

/** Mon–Fri grid (plus Sat when the plan needs it) with a block per session. */
export default function WeekView({
  items,
  allItems,
  showSaturday,
}: {
  /** Sessions running in the chosen week. */
  items: PlannedSession[];
  /** Every session in the plan, so the hour range stays the same from week to week. */
  allItems: PlannedSession[];
  showSaturday: boolean;
}) {
  const days = showSaturday ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  const starts = allItems.map((i) => toMinutes(i.session.start));
  const ends = allItems.map((i) => toMinutes(i.session.end));
  const firstHour = Math.min(9, ...starts.map((m) => Math.floor(m / 60)));
  const lastHour = Math.max(17, ...ends.map((m) => Math.ceil(m / 60)));
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);
  const clashing = clashingIndexes(items);
  const columns = days.map((day) => {
    const indexes = items.map((_, i) => i).filter((i) => items[i].session.day === day);
    const placements = assignOverlapLanes(indexes.map((i) => items[i].session));
    const lanes = Math.max(1, ...placements.map((placement) => placement.lanes));
    const dayWidth = dayWidthFor(indexes.map((i) => items[i].moduleCode));
    const minWidth = lanes === 1 ? dayWidth : lanes * Math.max(MIN_CLASH_LANE_WIDTH, dayWidth);
    return { day, indexes, placements, minWidth };
  });
  const minWidth = `calc(${AXIS_WIDTH + columns.reduce((width, column) => width + column.minWidth, 0)}rem + 2px)`;
  const gridTemplateColumns = [`${AXIS_WIDTH}rem`, ...columns.map((c) => `minmax(${c.minWidth}rem, 1fr)`)].join(" ");

  return (
    <div role="group" aria-label="Week timetable" tabIndex={0} className="focus-ring overflow-x-auto">
      <div style={{ minWidth }}>
        <div className="grid border-x border-transparent" style={{ gridTemplateColumns }} aria-hidden="true">
          <div />
          {days.map((d) => (
            <div key={d} className="pb-1 text-center text-small-medium text-fg-secondary">
              {DAY_SHORT[d]}
            </div>
          ))}
        </div>
        <div
          className="grid rounded-control border border-line bg-card"
          style={{ gridTemplateColumns, height: (lastHour - firstHour) * HOUR_HEIGHT }}
        >
          <div className="relative" aria-hidden="true">
            {hours.slice(0, -1).map((h) => (
              <span
                key={h}
                className="absolute right-1 -translate-y-1/2 text-micro-regular text-fg-secondary"
                style={{ top: (h - firstHour) * HOUR_HEIGHT }}
              >
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </div>
          {columns.map(({ day, indexes, placements }) => (
            <div key={day} className="relative border-l border-line">
              {hours.slice(1, -1).map((h) => (
                <div
                  key={h}
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-line"
                  style={{ top: (h - firstHour) * HOUR_HEIGHT }}
                />
              ))}
              {indexes.map((index, k) => {
                const item = items[index];
                const clash = clashing.has(index);
                const style = MODULE_STYLES[item.color];
                const top = ((toMinutes(item.session.start) - firstHour * 60) / 60) * HOUR_HEIGHT;
                const height = ((toMinutes(item.session.end) - toMinutes(item.session.start)) / 60) * HOUR_HEIGHT;
                const { lane, lanes } = placements[k];
                const width = 100 / lanes;
                const label = shortLabel(item.lessonType, item.sectionId);
                const description = `${item.moduleCode} ${label}, ${DAY_SHORT[day]} ${item.session.start} to ${item.session.end}, ${venueLabel(item.session)}${clash ? ", clash" : ""}`;
                return (
                  <div
                    key={`${item.moduleCode}-${label}-${item.session.start}-${index}`}
                    role="img"
                    aria-label={description}
                    title={description}
                    className={`absolute overflow-hidden rounded-block px-0.5 py-0.5 ${style.tint} ${style.text} ${
                      clash ? "border-2 border-danger" : "border border-transparent"
                    }`}
                    style={{
                      top: top + 1,
                      height: height - 2,
                      left: `calc(${lane * width}% + 1px)`,
                      width: `calc(${width}% - 2px)`,
                    }}
                  >
                    <span className="block truncate text-micro">{item.moduleCode}</span>
                    <span className="flex items-center justify-between gap-0.5 text-micro-regular">
                      <span className="truncate">{label}</span>
                      {clash ? <Icon name="alert-circle" size={10} className="text-danger-text" /> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
