import { lessonTypeName } from "@/lib/class-types";
import type { ClashPartner } from "@/lib/plan";
import type { Section, Session } from "@/lib/schemas/dataset";
import { DAY_SHORT } from "@/lib/time";

/** [1,2,3,5,6] → "1–3, 5–6". Single weeks stay bare. */
export function formatWeekNumbers(weeks: number[]): string {
  const sorted = [...new Set(weeks)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = 0;
  for (let i = 1; i <= sorted.length; i++) {
    if (i === sorted.length || sorted[i] !== sorted[i - 1] + 1) {
      const from = sorted[start];
      const to = sorted[i - 1];
      parts.push(from === to ? `${from}` : `${from}–${to}`);
      start = i;
    }
  }
  return parts.join(", ");
}

/** "Thu 13:00–16:00", with the weeks appended when the session doesn't run all term. */
export function sessionTime(session: Session, teachingWeeks: number): string {
  const base = `${DAY_SHORT[session.day]} ${session.start}–${session.end}`;
  return session.weeks.length >= teachingWeeks ? base : `${base} · wk ${formatWeekNumbers(session.weeks)}`;
}

/** "Clashes with INF1107 Lecture". Names two classes at most, then counts the rest. */
export function clashSummary(partners: ClashPartner[]): string {
  const names = partners.map((p) => `${p.moduleCode} ${lessonTypeName(p.lessonType)}`);
  const listed = names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2} more` : names.join(" and ");
  return `Clashes with ${listed}`;
}

export function venueLabel(session: Session): string {
  return session.venue ?? "Venue TBA";
}

/** One line per session: "Fri 09:00–12:00 · wk 1–11 · Sample Lab A". */
export function sectionLines(section: Section, teachingWeeks: number): string[] {
  return section.sessions.map((s) => `${sessionTime(s, teachingWeeks)} · ${venueLabel(s)}`);
}
