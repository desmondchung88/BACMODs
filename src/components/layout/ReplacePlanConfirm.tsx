"use client";

import { useEffect, useRef } from "react";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";

/** Asks before a share code overwrites a saved plan. Focus starts on the choice that changes nothing. */
export default function ReplacePlanConfirm({
  planName,
  onReplace,
  onKeep,
}: {
  /** "AY26 · Y1T2" */
  planName: string;
  onReplace: () => void;
  onKeep: () => void;
}) {
  const keep = useRef<HTMLButtonElement>(null);
  useEffect(() => keep.current?.focus(), []);
  return (
    <div className="flex flex-col gap-3">
      <Banner variant="warning">Replace your saved plan for {planName}?</Banner>
      <p className="text-small text-fg-secondary">
        The shared plan will overwrite your added modules and section choices for this trimester.
      </p>
      <Button fullWidth onClick={onReplace}>
        Replace my plan
      </Button>
      <Button ref={keep} variant="secondary" fullWidth onClick={onKeep}>
        Keep my plan
      </Button>
    </div>
  );
}
