import { describe, expect, it } from "vitest";
import { clashSummary, formatWeekNumbers, sessionTime, venueLabel } from "@/lib/format";

const base = { day: 5 as const, start: "09:00", end: "12:00", venue: null };

describe("format", () => {
  it("compresses week ranges", () => {
    expect(formatWeekNumbers([1, 2, 3, 5, 6, 9])).toBe("1–3, 5–6, 9");
    expect(formatWeekNumbers([6])).toBe("6");
  });
  it("omits weeks for a session that runs all term", () => {
    expect(sessionTime({ ...base, weeks: [1, 2, 3] }, 3)).toBe("Fri 09:00–12:00");
  });
  it("adds weeks for a partial session", () => {
    expect(sessionTime({ ...base, weeks: [12, 13] }, 13)).toBe("Fri 09:00–12:00 · wk 12–13");
  });
  it("names up to two clashing classes, then counts the rest", () => {
    const partners = [
      { moduleCode: "TEST1001", lessonType: "LEC" },
      { moduleCode: "TEST1002", lessonType: "LAB" },
      { moduleCode: "TEST1003", lessonType: "TUT" },
      { moduleCode: "TEST1004", lessonType: "XYZ" },
    ];
    expect(clashSummary(partners.slice(0, 1))).toBe("Clashes with TEST1001 Lecture");
    expect(clashSummary(partners.slice(0, 2))).toBe("Clashes with TEST1001 Lecture and TEST1002 Laboratory");
    expect(clashSummary(partners.slice(0, 3))).toBe("Clashes with TEST1001 Lecture, TEST1002 Laboratory +1 more");
    expect(clashSummary(partners)).toBe("Clashes with TEST1001 Lecture, TEST1002 Laboratory +2 more");
    expect(clashSummary(partners.slice(3))).toBe("Clashes with TEST1004 XYZ");
  });
  it("falls back to Venue TBA", () => {
    expect(venueLabel({ ...base, weeks: [1] })).toBe("Venue TBA");
  });
});
