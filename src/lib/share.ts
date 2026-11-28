import { z } from "zod";
import { normalizeModuleCode } from "@/lib/plan";
import { SharePayloadSchema, type Plan, type SharePayload } from "@/lib/schemas/plan";

const CODE_PATTERN = /^BACMODS-[A-Z0-9]{5}$/;
const SHARE_RECORD_VERSION = 1;

const ShareRecordSchema = z.object({
  version: z.literal(SHARE_RECORD_VERSION),
  payload: SharePayloadSchema,
});

/**
 * Accepts a bare code ("BACMODS-7KQ2X") or a link ("https://…/?share=BACMODS-7KQ2X").
 * Returns the normalised code, or null when the input isn't shaped like one.
 */
export function parseShareInput(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  let candidate = text;
  try {
    const fromLink = new URL(text).searchParams.get("share");
    if (fromLink) candidate = fromLink;
  } catch {
    // Not a URL: treat it as a bare code.
  }
  candidate = candidate.trim().toUpperCase();
  return CODE_PATTERN.test(candidate) ? candidate : null;
}

export function makeShareRecord(payload: SharePayload): z.infer<typeof ShareRecordSchema> {
  return { version: SHARE_RECORD_VERSION, payload };
}

/** Order-independent form of the parts of a plan a student chooses: added modules and section picks. */
function choices({ added, selection }: Pick<Plan, "added" | "selection">): string {
  const picks = Object.entries(selection)
    .flatMap(([code, types]) => Object.entries(types).map(([type, id]) => `${code} ${type} ${id}`))
    .sort();
  return JSON.stringify([[...new Set(added.map(normalizeModuleCode))].sort(), picks]);
}

/** Would loading this share change a saved plan's modules or section picks? Colours don't count. */
export function shareChangesPlan(saved: Pick<Plan, "added" | "selection">, payload: SharePayload): boolean {
  return choices(saved) !== choices(payload);
}

export function lookupShare(input: string, records: Readonly<Record<string, unknown>>): SharePayload | null {
  const code = parseShareInput(input);
  if (!code) return null;
  const parsed = ShareRecordSchema.safeParse(records[code]);
  return parsed.success ? parsed.data.payload : null;
}
