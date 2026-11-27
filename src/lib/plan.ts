import type { Module, Section, Session, TermDataset } from "@/lib/schemas/dataset";
import { MODULE_COLORS, type ModuleColor, type Plan, type Selection } from "@/lib/schemas/plan";
import { shortLabel } from "@/lib/class-types";
import { clashingIndexes, sessionsClash } from "@/lib/clash";
import { toMinutes } from "@/lib/time";

export interface PlannedSession {
  moduleCode: string;
  color: ModuleColor;
  lessonType: string;
  sectionId: string;
  session: Session;
}

/** Lesson types of a module, in the order they first appear. */
export function lessonTypesOf(module: Module): string[] {
  return [...new Set(module.sections.map((s) => s.lessonType))];
}

export function sectionsOfType(module: Module, lessonType: string): Section[] {
  return module.sections.filter((s) => s.lessonType === lessonType);
}

/** Only one section exists → fixed (lock icon). */
export function isFixed(module: Module, lessonType: string): boolean {
  return sectionsOfType(module, lessonType).length === 1;
}

export function hasChoice(module: Module): boolean {
  return lessonTypesOf(module).some((t) => !isFixed(module, t));
}

/** First section of every lesson type: the starting point for a module. */
export function defaultSelectionFor(module: Module): Record<string, string> {
  const out: Record<string, string> = {};
  for (const type of lessonTypesOf(module)) out[type] = sectionsOfType(module, type)[0].id;
  return out;
}

/** First colour not yet used; from the eighth module the order starts again (design.md §2). */
export function nextColor(used: ModuleColor[]): ModuleColor {
  const free = MODULE_COLORS.find((c) => !used.includes(c));
  return free ?? MODULE_COLORS[used.length % MODULE_COLORS.length];
}

export function normalizeModuleCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

/** Module codes on the student's curriculum list for the plan's term, in display order. */
export function curriculumCodes(
  plan: Plan,
  dataset: TermDataset,
): { choice: string[]; fixed: string[]; optional: string[] } | null {
  const [, year, trimester] = /^Y(\d+)(T[1-3])$/.exec(plan.term) ?? [];
  const intake = /^AY(\d{2}|\d{4})$/.exec(plan.intake)?.[1];
  const intakeAy = intake?.length === 2 ? 2000 + Number(intake) : Number(intake);
  const entries = dataset.curriculum.filter(
    (entry) => entry.programme === plan.programme && entry.intakeAy === intakeAy
      && entry.year === Number(year) && entry.trimester === trimester,
  );
  if (entries.length === 0) return null;

  const kinds = new Map<string, "mandatory" | "elective">();
  for (const entry of entries) {
    const code = normalizeModuleCode(entry.code);
    if (Object.hasOwn(dataset.modules, code) && kinds.get(code) !== "mandatory") {
      kinds.set(code, entry.kind);
    }
  }

  const groups = { choice: [] as string[], fixed: [] as string[], optional: [] as string[] };
  for (const [code, kind] of kinds) {
    if (kind === "elective") groups.optional.push(code);
    else if (hasChoice(dataset.modules[code])) groups.choice.push(code);
    else groups.fixed.push(code);
  }
  return groups;
}

/** Every module in the plan: curriculum groups first, then added ones. */
export function planCodes(plan: Plan, dataset: TermDataset): string[] {
  const groups = curriculumCodes(plan, dataset);
  const listed = groups ? [...groups.choice, ...groups.fixed, ...groups.optional] : [];
  const added = plan.added.map(normalizeModuleCode).filter((code) => Object.hasOwn(dataset.modules, code));
  return [...new Set([...listed, ...added])];
}

export function makeInitialPlan(dataset: TermDataset, intake: string, term: string): Plan {
  const base: Plan = {
    programme: "BAC",
    intake,
    term,
    added: [],
    selection: {},
    colors: {},
    view: "auto",
    week: 1,
  };
  const used: ModuleColor[] = [];
  const selection: Selection = {};
  const colors: Record<string, ModuleColor> = {};
  for (const code of planCodes(base, dataset)) {
    const color = nextColor(used);
    used.push(color);
    colors[code] = color;
    selection[code] = defaultSelectionFor(dataset.modules[code]);
  }
  return { ...base, selection, colors };
}

type SectionResolution =
  | { status: "fixed" | "selected"; section: Section }
  | { status: "removed" | "unselected"; section?: undefined };

/** Resolve a saved pick before applying a default for fixed classes. */
export function resolveSection(plan: Plan, module: Module, lessonType: string): SectionResolution {
  const options = sectionsOfType(module, lessonType);
  const id = plan.selection[module.code]?.[lessonType];
  if (id !== undefined) {
    const section = options.find((option) => option.id === id);
    if (!section) return { status: "removed" };
    return { status: options.length === 1 ? "fixed" : "selected", section };
  }
  if (options.length === 1) return { status: "fixed", section: options[0] };
  return { status: "unselected" };
}

export function chosenSection(plan: Plan, module: Module, lessonType: string): Section | undefined {
  return resolveSection(plan, module, lessonType).section;
}

/** All sessions of the chosen sections, ready for the timetable views. */
export function plannedSessions(plan: Plan, dataset: TermDataset): PlannedSession[] {
  const out: PlannedSession[] = [];
  for (const code of planCodes(plan, dataset)) {
    const mod = dataset.modules[code];
    for (const lessonType of lessonTypesOf(mod)) {
      const section = chosenSection(plan, mod, lessonType);
      if (!section) continue;
      for (const session of section.sessions) {
        out.push({
          moduleCode: code,
          color: plan.colors[code] ?? "slate",
          lessonType,
          sectionId: section.id,
          session,
        });
      }
    }
  }
  return out;
}

/** Clashes among the chosen sections (any week). */
export function planClashes(
  plan: Plan,
  dataset: TermDataset,
): { count: number; items: PlannedSession[] } {
  const items = plannedSessions(plan, dataset);
  let count = 0;
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) if (sessionsClash(items[i].session, items[j].session)) count++;
  return { count, items };
}

export interface ClashPartner {
  moduleCode: string;
  lessonType: string;
}

/** A module, or one of its lesson types, to leave out because the sessions would replace it. */
type ClashIgnore = { moduleCode: string; lessonType?: string };

/** Chosen classes in the rest of the plan that these sessions would clash with, once each, in plan order. */
export function clashPartners(
  sessions: Session[],
  plan: Plan,
  dataset: TermDataset,
  ignore: ClashIgnore,
): ClashPartner[] {
  const partners = new Map<string, ClashPartner>();
  for (const { moduleCode, lessonType, session } of plannedSessions(plan, dataset)) {
    const ignored =
      moduleCode === ignore.moduleCode &&
      (ignore.lessonType === undefined || lessonType === ignore.lessonType);
    if (ignored || !sessions.some((s) => sessionsClash(s, session))) continue;
    partners.set(`${moduleCode}:${lessonType}`, { moduleCode, lessonType });
  }
  return [...partners.values()];
}

/** Would these sessions clash with the chosen sections of the rest of the plan? */
export function clashesWithPlan(
  sessions: Session[],
  plan: Plan,
  dataset: TermDataset,
  ignore: ClashIgnore,
): boolean {
  return clashPartners(sessions, plan, dataset, ignore).length > 0;
}

/** Check the same default picks that adding the module will apply. */
export function defaultSectionsClash(module: Module, plan: Plan, dataset: TermDataset): boolean {
  const picks = defaultSelectionFor(module);
  const sessions = module.sections
    .filter((section) => picks[section.lessonType] === section.id)
    .flatMap((section) => section.sessions);
  return clashingIndexes(sessions.map((session) => ({ session }))).size > 0
    || clashesWithPlan(sessions, plan, dataset, { moduleCode: module.code });
}

export interface PlanSummary {
  credits: number;
  daysOnCampus: number;
  earliestStart: string | null;
  clashes: number;
}

export function summarise(plan: Plan, dataset: TermDataset, { count, items } = planClashes(plan, dataset)): PlanSummary {
  const starts = items.map((i) => i.session.start).sort((a, b) => toMinutes(a) - toMinutes(b));
  return {
    credits: planCodes(plan, dataset).reduce((sum, c) => sum + dataset.modules[c].credits, 0),
    daysOnCampus: new Set(items.map((i) => i.session.day)).size,
    earliestStart: starts[0] ?? null,
    clashes: count,
  };
}

/** One row per module, with labels shared by the section chips and the copied list. */
export function sectionListRows(plan: Plan, dataset: TermDataset) {
  return planCodes(plan, dataset).map((code) => {
    const mod = dataset.modules[code];
    const sections = lessonTypesOf(mod).flatMap((type) => {
      const section = chosenSection(plan, mod, type);
      return section ? [shortLabel(section.lessonType, section.id)] : [];
    });
    return { code, color: plan.colors[code] ?? "slate", sections };
  });
}

/** Saturday sessions add a Sat tab and column (design.md §7). */
export function hasSaturday(items: PlannedSession[]): boolean {
  return items.some((i) => i.session.day === 6);
}
