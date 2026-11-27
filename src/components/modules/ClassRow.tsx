"use client";

import { useId, useState } from "react";
import SectionOption from "@/components/modules/SectionOption";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import { planActions } from "@/hooks/use-plan";
import { lessonTypeName, shortLabel } from "@/lib/class-types";
import { sectionLines } from "@/lib/format";
import { clashPartners, resolveSection, sectionsOfType } from "@/lib/plan";
import type { Module, TermDataset } from "@/lib/schemas/dataset";
import type { Plan } from "@/lib/schemas/plan";

/** A lesson type inside a module: Fixed (lock), Choice (chevron) or Choice open. */
export default function ClassRow({
  module,
  lessonType,
  plan,
  dataset,
}: {
  module: Module;
  lessonType: string;
  plan: Plan;
  dataset: TermDataset;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const color = plan.colors[module.code] ?? "slate";
  const teachingWeeks = dataset.calendar.teachingWeeks;
  const { status, section: chosen } = resolveSection(plan, module, lessonType);
  const options = sectionsOfType(module, lessonType);
  const editable = status !== "fixed" && options.length > 0;
  const name = lessonTypeName(lessonType);
  const warning = status === "removed" ? "bg-warning-50" : "";

  const summary = (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
      <span className="flex items-center gap-2">
        <span className="text-body-medium text-fg">{editable ? `${name} · pick one` : name}</span>
        {chosen ? <Chip color={color}>{shortLabel(lessonType, chosen.id)}</Chip> : null}
      </span>
      {chosen ? (
        sectionLines(chosen, teachingWeeks).map((line) => (
          <span key={line} className="text-small text-fg-secondary">
            {line}
          </span>
        ))
      ) : status === "removed" ? (
        // The saved section no longer exists in this dataset version (design.md §7).
        <span className="text-small-medium text-warning">
          {editable ? "Section removed — pick again" : "No sections available"}
        </span>
      ) : null}
    </span>
  );

  if (!editable) {
    return (
      <li className={`flex items-start gap-3 px-4 py-3 ${warning}`}>
        {summary}
        {status === "fixed" ? (
          <span className="mt-0.5 inline-flex items-center gap-1 text-small text-fg-secondary">
            <Icon name="lock" size={14} />
            <span>Fixed</span>
          </span>
        ) : null}
      </li>
    );
  }

  return (
    <li className={warning}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-start gap-3 px-4 py-3"
      >
        {summary}
        <Icon name={open ? "chevron-up" : "chevron-down"} className="mt-0.5 text-fg-secondary" />
        <span className="sr-only">{open ? "Hide sections" : "Show sections"}</span>
      </button>
      {open ? (
        <div id={listId} role="group" aria-label={`${name} sections for ${module.code}`} className="flex flex-col gap-2 px-4 pb-3">
          {options.map((section) => (
            <SectionOption
              key={section.id}
              name={`${module.code}-${lessonType}`}
              section={section}
              selected={chosen?.id === section.id}
              clashesWith={clashPartners(section.sessions, plan, dataset, { moduleCode: module.code, lessonType })}
              teachingWeeks={teachingWeeks}
              onSelect={() => planActions.pickSection(module.code, lessonType, section.id)}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
}
