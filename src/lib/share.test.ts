import { describe, expect, it } from "vitest";
import { lookupShare, makeShareRecord, parseShareInput, shareChangesPlan } from "@/lib/share";
import type { SharePayload } from "@/lib/schemas/plan";

describe("shareChangesPlan", () => {
  const saved: SharePayload = {
    programme: "BAC",
    intake: "AY2099",
    term: "Y2T3",
    added: ["TESTADD1", "TESTADD2"],
    selection: { TESTCORE1: { LAB: "L1", QUIZ: "Q1" }, TESTADD1: { LEC: "ALL" } },
    colors: { TESTCORE1: "green" },
  };

  it("ignores order, code spacing and colours", () => {
    expect(shareChangesPlan(saved, {
      ...saved,
      added: ["testadd 2", "TESTADD1"],
      selection: { TESTADD1: { LEC: "ALL" }, TESTCORE1: { QUIZ: "Q1", LAB: "L1" } },
      colors: { TESTCORE1: "pink" },
    })).toBe(false);
  });
  it("notices a different section pick", () => {
    const selection = { ...saved.selection, TESTCORE1: { LAB: "L2", QUIZ: "Q1" } };
    expect(shareChangesPlan(saved, { ...saved, selection })).toBe(true);
  });
  it("notices an added or dropped module", () => {
    expect(shareChangesPlan(saved, { ...saved, added: ["TESTADD1"] })).toBe(true);
    expect(shareChangesPlan(saved, { ...saved, added: [...saved.added, "TESTADD3"] })).toBe(true);
  });
});

describe("parseShareInput", () => {
  it("accepts a bare code, trimmed and uppercased", () => {
    expect(parseShareInput("  bacmods-7kq2x ")).toBe("BACMODS-7KQ2X");
  });
  it("accepts a share link", () => {
    expect(parseShareInput("https://example.test/?share=BACMODS-7KQ2X")).toBe("BACMODS-7KQ2X");
  });
  it("rejects anything else", () => {
    expect(parseShareInput("")).toBeNull();
    expect(parseShareInput("hello")).toBeNull();
    expect(parseShareInput("BACMODS-123")).toBeNull();
  });
});

describe("lookupShare", () => {
  const code = "BACMODS-ZZ999";
  const payload: SharePayload = {
    programme: "BAC",
    intake: "AY2099",
    term: "Y2T3",
    added: ["TESTELECTIVE9"],
    selection: { TESTCORE1: { LAB: "TESTLAB1", QUIZ: "TESTQUIZ1" }, TESTELECTIVE9: { LEC: "TESTLECTURE1" } },
    colors: { TESTCORE1: "green", TESTELECTIVE9: "pink" },
  };
  const records = { [code]: makeShareRecord(payload) };

  it("round-trips every share payload field through a stored record", () => {
    expect(lookupShare(code, JSON.parse(JSON.stringify(records)))).toEqual(payload);
  });

  it("loads the share payload and drops an unknown field", () => {
    const record = { ...records[code], payload: { ...payload, datasetVersion: "synthetic-v2" } };
    expect(lookupShare(code, { [code]: record })).toStrictEqual(payload);
  });

  it("rejects tampered and truncated codes", () => {
    expect(lookupShare("BACMODS-ZZ998", records)).toBeNull();
    expect(lookupShare("BACMODS-ZZ99", records)).toBeNull();
  });

  it("rejects a registered code with an unknown record version", () => {
    expect(lookupShare(code, { [code]: { ...records[code], version: 999 } })).toBeNull();
  });
});
