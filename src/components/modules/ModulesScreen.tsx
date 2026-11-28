"use client";

import AddModuleSearch from "@/components/modules/AddModuleSearch";
import AutoPickMenu from "@/components/modules/AutoPickMenu";
import ModuleCard from "@/components/modules/ModuleCard";
import WeekPreview from "@/components/modules/WeekPreview";
import Banner from "@/components/ui/Banner";
import { useIsDesktop } from "@/hooks/use-desktop";
import { usePlan } from "@/hooks/use-plan";
import { MOCK_DATASET, MOCK_TERM } from "@/lib/mock/dataset";
import { curriculumCodes, planClashes, planCodes, summarise } from "@/lib/plan";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-label uppercase text-fg-secondary">{title}</h2>
      {children}
    </section>
  );
}

/** Stats share the row's height, so values stay level when a label wraps. */
function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-0.5">
      <dt className="text-caption text-fg-secondary">{label}</dt>
      <dd className={`text-title ${alert ? "text-danger-text" : "text-fg"}`}>{value}</dd>
    </div>
  );
}

export default function ModulesScreen() {
  const plan = usePlan();
  const desktop = useIsDesktop();
  const dataset = MOCK_DATASET;
  const groups = curriculumCodes(plan, dataset);
  const clashes = planClashes(plan, dataset);
  const summary = summarise(plan, dataset, clashes);
  const listed = new Set(groups ? [...groups.choice, ...groups.fixed, ...groups.optional] : []);
  const added = planCodes(plan, dataset).filter((code) => !listed.has(code));
  const card = (code: string, removable = false) => (
    <ModuleCard key={code} module={dataset.modules[code]} plan={plan} dataset={dataset} removable={removable} />
  );

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[clamp(26rem,40vw,30rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-heading">Modules</h1>
        <AutoPickMenu />
      </div>

      <Banner variant="info">Showing sample timetable data. Real timetables arrive in a later update.</Banner>

      <dl className="grid grid-cols-4 gap-2 rounded-control border border-line bg-card px-4 py-3">
        <Stat label="Credits" value={String(summary.credits)} />
        <Stat label="Days on campus" value={String(summary.daysOnCampus)} />
        <Stat label="Earliest start" value={summary.earliestStart ?? "–"} />
        <Stat
          label="Clashes"
          value={summary.clashes === 0 ? "None" : String(summary.clashes)}
          alert={summary.clashes > 0}
        />
      </dl>

      {groups ? (
        <>
          {groups.choice.length > 0 ? <Group title="Mandatory · with choice">{groups.choice.map((c) => card(c))}</Group> : null}
          {groups.fixed.length > 0 ? <Group title="Mandatory · no choice">{groups.fixed.map((c) => card(c))}</Group> : null}
          <Group title="Optional">
            {groups.optional.length > 0 ? (
              groups.optional.map((c) => card(c))
            ) : (
              <p className="rounded-control border border-dashed border-line bg-card px-4 py-4 text-body text-fg-secondary">
                No optional modules in {plan.term}.
              </p>
            )}
          </Group>
        </>
      ) : (
        <Banner variant="info">Curriculum for {plan.intake} · {plan.term} is unavailable. You can still add modules below.</Banner>
      )}
      {added.length > 0 ? <Group title="Not on your list">{added.map((c) => card(c, true))}</Group> : null}

      <AddModuleSearch plan={plan} dataset={dataset} />

      <p className="text-small text-fg-secondary">
        Unofficial planning tool. Check the registration system before you register. Sample data · version{" "}
        {dataset.version}.
      </p>
      </div>
      {desktop && plan.term === MOCK_TERM.term ? (
        <WeekPreview items={clashes.items} count={clashes.count} selectedWeek={plan.week} calendar={dataset.calendar} />
      ) : null}
    </div>
  );
}
