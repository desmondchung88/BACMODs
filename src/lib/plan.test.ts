import { describe, expect, it } from "vitest";
import { MOCK_DATASET } from "@/lib/mock/dataset";
import {
  clashesWithPlan,
  clashPartners,
  curriculumCodes,
  defaultSectionsClash,
  defaultSelectionFor,
  makeInitialPlan,
  nextColor,
  planClashes,
  planCodes,
  resolveSection,
  sectionListRows,
  summarise,
} from "@/lib/plan";
import type { CurriculumEntry, TermDataset } from "@/lib/schemas/dataset";

const plan = () => makeInitialPlan(MOCK_DATASET, "AY26", "Y1T2");

describe("plan", () => {
  it("assigns colours in the documented order", () => {
    expect(plan().colors).toEqual({ INF1105: "blue", INF1107: "purple", INF2008: "green", AAI1001: "orange" });
  });
  it("groups a shared module by intake and deduplicates only matching curriculum rows", () => {
    const elective: CurriculumEntry = {
      code: "INF1105", programme: "BAC", intakeAy: 2025, year: 1, trimester: "T2", kind: "elective",
    };
    const dataset: TermDataset = {
      ...MOCK_DATASET,
      curriculum: [
        ...MOCK_DATASET.curriculum,
        elective,
        { ...elective, code: " inf 1105 " },
        { ...elective, code: "INF2008", programme: "OTHER" },
        { ...elective, code: "INF1107", year: 2 },
        { ...elective, code: "AAI1001", trimester: "T3" },
        { ...elective, intakeAy: 2026 },
      ],
    };
    const earlier = makeInitialPlan(dataset, "AY25", "Y1T2");
    expect(curriculumCodes(earlier, dataset)).toEqual({ choice: [], fixed: [], optional: ["INF1105"] });
    expect(curriculumCodes(plan(), dataset)).toEqual({
      choice: ["INF1105", "INF1107"], fixed: ["INF2008", "AAI1001"], optional: [],
    });
    expect(planCodes({ ...earlier, added: ["INF1105", "BAC4000A", "BAC4000A"] }, dataset)).toEqual([
      "INF1105", "BAC4000A",
    ]);
  });
  it("distinguishes an unavailable curriculum from an available one with no optional modules", () => {
    const earlier = makeInitialPlan(MOCK_DATASET, "AY25", "Y1T2");
    expect(curriculumCodes(earlier, MOCK_DATASET)).toBeNull();
    expect(curriculumCodes({ ...plan(), term: "Y1T3" }, MOCK_DATASET)).toBeNull();
    expect(curriculumCodes(plan(), MOCK_DATASET)?.optional).toEqual([]);
    expect(planCodes(earlier, MOCK_DATASET)).toEqual([]);
    expect(planCodes({ ...earlier, added: ["TESTMISSING001", "INF1105"] }, MOCK_DATASET)).toEqual(["INF1105"]);
  });
  it("finds the same curriculum for AY26 and AY2026", () => {
    const shortIntake = plan();
    const longIntake = { ...shortIntake, intake: "AY2026" };
    const groups = curriculumCodes(shortIntake, MOCK_DATASET);
    expect(groups).not.toBeNull();
    expect(curriculumCodes(longIntake, MOCK_DATASET)).toEqual(groups);
  });
  it("wraps the colour order from the eighth module", () => {
    expect(nextColor(["blue", "purple", "green", "orange", "pink", "teal", "slate"])).toBe("blue");
  });
  it("starts clash-free on the default sections", () => {
    expect(planClashes(plan(), MOCK_DATASET).count).toBe(0);
  });
  it("flags the capstone seminar as clashing with the data structures lecture", () => {
    const p = plan();
    expect(clashesWithPlan(MOCK_DATASET.modules.BAC4000A.sections[0].sessions, p, MOCK_DATASET, { moduleCode: "BAC4000A" })).toBe(true);
  });
  it("names the chosen class a section would clash with, leaving out the pick it replaces", () => {
    const tutorial = (id: string) => MOCK_DATASET.modules.INF1105.sections.find((section) => section.id === id)!;
    const ignore = { moduleCode: "INF1105", lessonType: "TUT" };
    expect(clashPartners(tutorial("T1").sessions, plan(), MOCK_DATASET, ignore)).toEqual([]);
    expect(clashPartners(tutorial("T2").sessions, plan(), MOCK_DATASET, ignore)).toEqual([
      { moduleCode: "INF2008", lessonType: "LEC" },
    ]);
  });
  it("lists each clashing class once, in plan order", () => {
    const lecture = MOCK_DATASET.modules.INF1107.sections[0].sessions[0];
    const tutorial = MOCK_DATASET.modules.INF2008.sections[0].sessions[0];
    const sessions = [tutorial, lecture, lecture];
    expect(clashPartners(sessions, plan(), MOCK_DATASET, { moduleCode: "BAC4000A" })).toEqual([
      { moduleCode: "INF1107", lessonType: "LEC" },
      { moduleCode: "INF2008", lessonType: "LEC" },
    ]);
  });
  it("does not name a class that runs in different weeks", () => {
    const quiz = MOCK_DATASET.modules.INF1107.sections.find((section) => section.id === "Q1")!.sessions[0];
    const ignore = { moduleCode: "BAC4000A" };
    expect(clashPartners([{ ...quiz, weeks: [1, 2, 3, 4, 5] }], plan(), MOCK_DATASET, ignore)).toEqual([]);
    expect(clashPartners([quiz], plan(), MOCK_DATASET, ignore)).toEqual([
      { moduleCode: "INF1107", lessonType: "QUIZ" },
    ]);
  });
  it("checks only the sections that adding a search result would pick", () => {
    const p = plan();
    p.selection.INF1107.QUIZ = "Q2";
    const mod = MOCK_DATASET.modules.INF2006;
    const alternative = mod.sections.find((section) => section.id === "L2")!;
    expect(clashesWithPlan(alternative.sessions, p, MOCK_DATASET, { moduleCode: mod.code })).toBe(true);
    expect(defaultSelectionFor(mod).LAB).toBe("L1");
    expect(defaultSectionsClash(mod, p, MOCK_DATASET)).toBe(false);
    expect(defaultSectionsClash(MOCK_DATASET.modules.BAC4000A, p, MOCK_DATASET)).toBe(true);
  });
  it("flags overlaps between a result's own default sections", () => {
    const mod = MOCK_DATASET.modules.INF2006;
    const sessions = mod.sections[0].sessions;
    const overlapping = { ...mod, sections: [mod.sections[0], { id: "L1", lessonType: "LAB", sessions }] };
    expect(defaultSectionsClash(overlapping, plan(), MOCK_DATASET)).toBe(true);
  });
  it("keeps a removed pick unresolved when its replacement is the only remaining option", () => {
    const p = plan();
    const mod = MOCK_DATASET.modules.INF1107;
    const replacement = mod.sections.find((section) => section.id === "P2")!;
    const updated = { ...mod, sections: [replacement] };
    const dataset = { ...MOCK_DATASET, modules: { ...MOCK_DATASET.modules, INF1107: updated } };
    expect(resolveSection(p, updated, "LAB")).toEqual({ status: "removed" });
    expect(sectionListRows(p, dataset)[1].sections).not.toContain("LAB P2");

    p.selection.INF1107.LAB = "P2";
    expect(resolveSection(p, updated, "LAB")).toEqual({ status: "fixed", section: replacement });
    expect(sectionListRows(p, dataset)[1].sections).toContain("LAB P2");
  });
  it("defaults a fixed lesson only when there was no saved choice", () => {
    const p = plan();
    const mod = MOCK_DATASET.modules.INF1107;
    delete p.selection.INF1107.LEC;
    expect(resolveSection(p, mod, "LEC")).toEqual({ status: "fixed", section: mod.sections[0] });
    expect(resolveSection(p, mod, "WKS")).toEqual({ status: "unselected" });
    p.selection.INF1107.WKS = "W1";
    expect(resolveSection(p, mod, "WKS")).toEqual({ status: "removed" });
  });
  it("reports a clash once the module is added", () => {
    const p = { ...plan(), added: ["BAC4000A"], colors: { ...plan().colors, BAC4000A: "pink" as const } };
    expect(planClashes(p, MOCK_DATASET).count).toBe(1);
  });
  it("summarises credits, days and earliest start", () => {
    expect(summarise(plan(), MOCK_DATASET)).toMatchObject({ credits: 15, earliestStart: "09:00", clashes: 0 });
  });
  it("lists the chosen section labels and colour for each module", () => {
    expect(sectionListRows(plan(), MOCK_DATASET)[1]).toEqual({
      code: "INF1107",
      color: "purple",
      sections: ["LEC ALL", "LAB P1", "QUIZ Q1"],
    });
  });
});
