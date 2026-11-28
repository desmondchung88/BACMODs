"use client";

import { useSyncExternalStore } from "react";
import { MOCK_DATASET, MOCK_TERM } from "@/lib/mock/dataset";
import { makeInitialPlan } from "@/lib/plan";
import { addModule, pickSection, removeModule, replayEdits, setView, stepWeek, type PlanEdit } from "@/lib/plan-edits";
import { parsePlan, type Plan, type SharePayload } from "@/lib/schemas/plan";

/**
 * Keep a separate localStorage record for each programme, intake and term, plus an active pointer.
 * The server and the first client render use the default snapshot until storage is read.
 */
const LEGACY_KEY = "bacmods:plan:v1";
const PLAN_PREFIX = "bacmods:plan:v2:";
const ACTIVE_KEY = `${PLAN_PREFIX}active`;
const DEFAULT_PLAN: Plan = makeInitialPlan(MOCK_DATASET, MOCK_TERM.intake, MOCK_TERM.term);
const SERVER_SNAPSHOT = { plan: DEFAULT_PLAN, loaded: false, configured: false };
type PlanContext = Pick<Plan, "programme" | "intake" | "term">;

let snapshot = SERVER_SNAPSHOT;
const unsaved = new Map<string, { base: Plan; edits: PlanEdit[] }>();
const listeners = new Set<() => void>();

function planKey({ programme, intake, term }: PlanContext): string {
  return `${PLAN_PREFIX}${JSON.stringify([programme, intake, term])}`;
}

function read(key: string): string | null | undefined {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return undefined;
  }
}

function write(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function contextPlan(key: string, raw: string | null | undefined): Plan | undefined {
  const plan = parsePlan(raw);
  return plan && planKey(plan) === key ? plan : undefined;
}

function activePlan(): Plan | undefined {
  const key = read(ACTIVE_KEY);
  return key?.startsWith(PLAN_PREFIX) ? contextPlan(key, read(key)) : undefined;
}

function getSnapshot() {
  if (!snapshot.loaded) {
    const stored = activePlan();
    const legacy = stored ? undefined : parsePlan(read(LEGACY_KEY));
    const key = planKey(stored ?? legacy ?? DEFAULT_PLAN);
    const saved = stored ?? contextPlan(key, read(key)) ?? legacy;
    snapshot = { plan: saved ?? DEFAULT_PLAN, loaded: true, configured: !!saved };
  }
  return snapshot;
}

function initialPlan(context: PlanContext, view: Plan["view"]): Plan {
  const legacy = parsePlan(read(LEGACY_KEY));
  if (legacy && planKey(legacy) === planKey(context)) return legacy;
  return {
    ...makeInitialPlan(MOCK_DATASET, context.intake, context.term),
    programme: context.programme,
    view,
  };
}

/** The plan this device already holds for a programme, intake and term, if any. */
export function savedPlanFor(context: PlanContext): Plan | undefined {
  const key = planKey(context);
  const pending = unsaved.get(key);
  const base = contextPlan(key, read(key)) ?? pending?.base;
  if (base) return pending ? replayEdits(base, pending.edits) : base;
  const { plan, configured } = getSnapshot();
  if (configured && planKey(plan) === key) return plan;
  const legacy = parsePlan(read(LEGACY_KEY));
  return legacy && planKey(legacy) === key ? legacy : undefined;
}

function publish(plan: Plan, configured = snapshot.configured): void {
  if (snapshot.plan === plan && snapshot.configured === configured) return;
  snapshot = { plan, loaded: true, configured };
  listeners.forEach((listener) => listener());
}

/** Keep read-modify-write under the same lock in every tab that supports Web Locks. */
async function withWriteLock(work: () => void): Promise<void> {
  let started = false;
  try {
    const locks = navigator.locks;
    if (locks) {
      await locks.request("bacmods:plan", () => {
        started = true;
        work();
      });
      return;
    }
  } catch (error) {
    if (started) throw error;
  }
  work();
}

function migrateLegacy(): void {
  const legacy = parsePlan(read(LEGACY_KEY));
  if (!legacy || activePlan()) return;
  void withWriteLock(() => {
    if (activePlan()) return;
    const key = planKey(legacy);
    const raw = read(key);
    if (raw !== undefined && (contextPlan(key, raw) || write(key, JSON.stringify(legacy)))) {
      write(ACTIVE_KEY, key);
    }
  });
}

function changePlan(context: PlanContext, edit?: PlanEdit, activate = false): Promise<void> {
  const displayed = getSnapshot().plan;
  const key = planKey(context);
  return withWriteLock(() => {
    const raw = read(key);
    const pending = unsaved.get(key);
    const now = getSnapshot().plan;
    const fallback = [now, displayed].find((plan) => planKey(plan) === key);
    const base = contextPlan(key, raw) ?? pending?.base ?? fallback ?? initialPlan(context, displayed.view);
    const edits = pending?.edits ?? [];
    const current = replayEdits(base, edits);
    const next = edit ? edit(current) : current;
    const nextEdits = edit && next !== current ? [...edits, edit] : edits;

    if (activate || nextEdits.length > 0) {
      if (raw !== undefined && write(key, JSON.stringify(next))) {
        unsaved.delete(key);
        if (activate) write(ACTIVE_KEY, key);
      } else {
        // Replay unsaved edits on the latest stored plan if persistence becomes available again.
        unsaved.set(key, { base, edits: nextEdits });
      }
    }
    if (activate || planKey(now) === key) publish(next, activate || snapshot.configured);
  });
}

function editDisplayed(edit: PlanEdit): Promise<void> {
  return changePlan(getSnapshot().plan, edit);
}

function syncDisplayed(): void {
  if (!getSnapshot().configured) {
    const saved = activePlan();
    if (saved) publish(saved, true);
    return;
  }
  const key = planKey(getSnapshot().plan);
  const stored = contextPlan(key, read(key));
  if (!stored) return;
  const pending = unsaved.get(key);
  if (pending) pending.base = stored;
  const plan = pending ? replayEdits(stored, pending.edits) : stored;
  if (JSON.stringify(plan) !== JSON.stringify(snapshot.plan)) publish(plan);
}

function onStorage(event: StorageEvent): void {
  if (event.key !== planKey(getSnapshot().plan) && (snapshot.configured || event.key !== ACTIVE_KEY)) return;
  try {
    if (event.storageArea !== window.localStorage) return;
  } catch {
    return;
  }
  syncDisplayed();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
    syncDisplayed();
    migrateLegacy();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export const planActions = {
  setSetup(intake: string, term: string) {
    const { plan } = getSnapshot();
    return changePlan({ programme: plan.programme, intake, term }, undefined, true);
  },
  pickSection(moduleCode: string, lessonType: string, sectionId: string) {
    return editDisplayed((plan) => pickSection(plan, MOCK_DATASET, moduleCode, lessonType, sectionId));
  },
  addModule(code: string) {
    return editDisplayed((plan) => addModule(plan, MOCK_DATASET, code));
  },
  removeModule(code: string) {
    return editDisplayed((plan) => removeModule(plan, MOCK_DATASET, code));
  },
  setView(view: Plan["view"]) {
    return editDisplayed((plan) => setView(plan, view));
  },
  stepWeek(step: -1 | 1) {
    return editDisplayed((plan) => stepWeek(plan, step, MOCK_DATASET.calendar.teachingWeeks));
  },
  loadShared(payload: SharePayload) {
    return changePlan(payload, (plan) => ({ ...plan, ...payload }), true);
  },
};

export function usePlanState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

export function usePlan(): Plan {
  return usePlanState().plan;
}
