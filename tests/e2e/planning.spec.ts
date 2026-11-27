import { expect, test, type Locator } from "@playwright/test";
import { startPlanningAt } from "./setup";

const unavailable = "Curriculum for AY25 · Y1T2 is unavailable. You can still add modules below.";
const invalidCode = "That code doesn't match a saved plan. Check it and try again.";
const offline = "You're offline. Showing saved timetable";

test("legacy plans migrate and switching intakes restores each plan", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bacmods:plan:v1", JSON.stringify({
      programme: "BAC", intake: "AY25", term: "Y1T2", added: ["INF2006"],
      selection: { INF2006: { LEC: "ALL", LAB: "L2" } }, colors: { INF2006: "teal" }, view: "week", week: 4,
    }));
  });

  await page.goto("/");
  await expect(page.getByRole("combobox", { name: "Intake" })).toHaveValue("AY25");
  await page.getByRole("button", { name: "Start planning" }).click();
  const added = page.getByRole("region", { name: "INF2006" });
  await expect(page.getByText(unavailable)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Optional", exact: true })).toBeHidden();
  await expect(added.getByText("LAB L2")).toBeVisible();
  await expect(added.getByRole("heading")).toHaveClass(/text-module-teal-text/);

  const setup = page.getByRole("dialog", { name: "Your plan" });
  await page.getByRole("button", { name: /Plan: BAC, AY25/ }).click();
  await expect(setup.getByRole("combobox", { name: "Intake" })).toHaveValue("AY25");
  await setup.getByRole("combobox", { name: "Intake" }).selectOption("AY26");
  await setup.getByRole("button", { name: "Update plan" }).click();
  await expect(page.getByText("No optional modules in Y1T2.")).toBeVisible();
  await expect(added).toBeHidden();
  const structures = page.getByRole("region", { name: "INF1107" });
  await structures.getByRole("button", { name: /Laboratory · pick one/ }).click();
  await structures.locator("label", { hasText: "P2" }).click();
  await expect(structures.getByText("LAB P2", { exact: true })).toBeVisible();
  await page.reload();
  await expect(structures.getByText("LAB P2", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Plan: BAC, AY26/ }).click();
  await setup.getByRole("combobox", { name: "Intake" }).selectOption("AY25");
  await setup.getByRole("button", { name: "Update plan" }).click();
  await expect(added.getByText("LAB L2")).toBeVisible();
  await page.getByRole("link", { name: "Timetable" }).click();
  await expect(page.getByRole("paragraph").getByText("Week 4", { exact: true })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("combobox", { name: "Intake" })).toHaveValue("AY25");
  await page.getByRole("combobox", { name: "Intake" }).selectOption("AY26");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(structures.getByText("LAB P2", { exact: true })).toBeVisible();
});

test("search badges use the defaults applied by Add", async ({ page }) => {
  await startPlanningAt(page, "/modules");
  const structures = page.getByRole("region", { name: "INF1107" });
  await structures.getByRole("button", { name: /Quiz · pick one/ }).click();
  await structures.locator("label", { hasText: "Q2" }).click();
  const candidate = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: "Add INF2006" }) });
  await expect(candidate.getByText("Addable", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add INF2006" }).click();
  await expect(page.getByRole("region", { name: "INF2006" }).getByText("LAB L1", { exact: true })).toBeVisible();
  await expect(page.getByText("In plan", { exact: true })).toBeVisible();
});

test("a removed pick must be replaced even if only one section remains", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bacmods:plan:v1", JSON.stringify({
      programme: "BAC", intake: "AY26", term: "Y1T2", added: [],
      selection: { INF1105: { LTR: "OLD", TUT: "T1" } }, colors: { INF1105: "blue" }, view: "auto", week: 1,
    }));
  });
  await page.goto("/modules");
  const programming = page.getByRole("region", { name: "INF1105" });
  const removed = programming.getByRole("button", { name: /Section removed — pick again/ });
  await expect(removed).toBeVisible();
  await expect(programming.getByText("LTR ALL", { exact: true })).toBeHidden();
  await removed.click();
  await programming.locator("label", { hasText: "ALL" }).click();
  await expect(removed).toBeHidden();
  await expect(programming.getByText("LTR ALL", { exact: true })).toBeVisible();
  await expect(programming.getByText("Fixed", { exact: true })).toBeVisible();
});

test("a removed lesson type explains that there are no sections to pick", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bacmods:plan:v1", JSON.stringify({
      programme: "BAC", intake: "AY26", term: "Y1T2", added: [],
      selection: { INF1105: { WKS: "OLD" } }, colors: {}, view: "auto", week: 1,
    }));
  });
  await page.goto("/modules");
  const workshop = page.getByRole("region", { name: "INF1105" }).getByRole("listitem").filter({ hasText: "Workshop" });
  await expect(workshop.getByText("No sections available", { exact: true })).toBeVisible();
  await expect(workshop.getByRole("button")).toHaveCount(0);
});

test("an unsupported saved term shows a setup path and no sample timetable", async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'bacmods:plan:v2:["BAC","AY26","Y1T3"]';
    localStorage.setItem("bacmods:plan:v2:active", key);
    localStorage.setItem(key, JSON.stringify({
      programme: "BAC", intake: "AY26", term: "Y1T3", added: ["INF2006"],
      selection: { INF2006: { LEC: "ALL", LAB: "L2" } }, colors: { INF2006: "teal" }, view: "week", week: 4,
    }));
  });
  await page.goto("/timetable");
  const warning = page.getByRole("alert").filter({ hasText: "Timetable for Y1T3 isn't out yet" });
  await expect(warning).toBeVisible();
  await expect(page.getByRole("group", { name: "Week timetable" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next week" })).toHaveCount(0);
  await page.getByRole("link", { name: "Modules" }).click();
  await expect(page.getByRole("heading", { name: "Modules", level: 1 })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Week preview", includeHidden: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Timetable" }).click();
  await warning.getByRole("link", { name: "Go to setup" }).click();
  await expect(page.getByRole("combobox", { name: "Trimester" })).toHaveValue("Y1T2");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page.getByRole("button", { name: /Plan: BAC, AY26, Y1T2/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add INF2006" })).toBeVisible();
});

test("day tabs keep the selected weekday across weeks and support keyboard navigation", async ({ page }) => {
  await startPlanningAt(page, "/timetable");
  await page.getByRole("button", { name: "Day", exact: true }).click();
  const tabs = page.getByRole("tablist", { name: "Day" });
  const monday = tabs.getByRole("tab", { name: /^Mon / });
  const tuesday = tabs.getByRole("tab", { name: /^Tue / });
  const friday = tabs.getByRole("tab", { name: /^Fri / });
  const nextWeek = page.getByRole("button", { name: "Next week" });

  await expect(monday).toBeVisible();
  await nextWeek.focus();
  await page.keyboard.press("Tab");
  await expect(monday).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(tuesday).toBeFocused();
  await expect(tuesday).toHaveAttribute("aria-selected", "true");
  await expect(tabs.locator('[tabindex="0"]')).toHaveCount(1);
  await expect(monday).toHaveAttribute("tabindex", "-1");
  const panel = page.getByRole("tabpanel", { name: /^Tue / });
  await expect(panel.getByText("INF1107", { exact: true })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(panel).toBeFocused();

  await nextWeek.dblclick();
  await expect(page.getByText("Week 3", { exact: true })).toBeVisible();
  await expect(tuesday).toHaveAttribute("aria-selected", "true");
  await expect(tuesday).toHaveAccessibleName("Tue 26 Jan");
  await expect(panel.getByText("INF1107", { exact: true })).toBeVisible();

  await tuesday.press("End");
  await expect(friday).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(monday).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(friday).toBeFocused();
  await page.keyboard.press("Home");
  await expect(monday).toBeFocused();
  await expect(monday).toHaveAttribute("aria-selected", "true");
});

test("copy list is disabled for an empty plan and copies the displayed sections once added", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("combobox", { name: "Intake" }).selectOption("AY25");
  await page.getByRole("button", { name: "Start planning" }).click();
  await page.getByRole("link", { name: "Export" }).click();
  const copy = page.getByRole("button", { name: "Copy list" });
  await expect(copy).toBeDisabled();
  await page.getByRole("link", { name: "Modules" }).click();
  await page.getByRole("button", { name: "Add INF2006" }).click();
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await page.getByRole("link", { name: "Export" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "INF2006" }).getByText("LAB L1")).toBeVisible();
  await copy.click();
  await expect(page.getByRole("status").filter({ hasText: "Section list copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("INF2006 LEC ALL · LAB L1");
});

test("Auto-pick handles arrow keys only inside the menu", async ({ page }) => {
  await startPlanningAt(page, "/modules");
  const trigger = page.getByRole("button", { name: "Auto-pick" });
  const menu = page.getByRole("menu", { name: "Auto-pick options" });
  const first = menu.getByRole("menuitem", { name: "Fewest days on campus" });
  await trigger.press("Enter");
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: /Start late/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menu).toBeHidden();

  await trigger.press("Enter");
  await expect(first).toBeFocused();
  const search = page.getByRole("searchbox", { name: "Search by code or name" });
  await search.focus();
  await page.keyboard.press("ArrowDown");
  await expect(search).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.press("Enter");
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(menu).toBeHidden();
});

test("direct share links load the same plan as a pasted code", async ({ page }) => {
  await page.goto("/?share=%20bacmods-7kq2x%20");
  await expect(page).toHaveURL(/\/modules$/);
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
  await expect(page.getByRole("region", { name: "INF1107" }).getByText("LAB P2", { exact: true })).toBeVisible();
});

test("a share code asks before replacing a saved plan", async ({ page }) => {
  await startPlanningAt(page, "/modules");
  const added = page.getByRole("button", { name: "Remove INF2006" });
  await page.getByRole("button", { name: /^Plan: BAC,/ }).click();
  const setup = page.getByRole("dialog", { name: "Your plan" });
  const input = setup.getByRole("textbox", { name: "Share code" });
  const load = setup.getByRole("button", { name: "Load plan" });
  const keep = setup.getByRole("button", { name: "Keep my plan" });

  await input.fill("BACMODS-7KQ2X");
  await load.click();
  await expect(setup.getByRole("alert")).toHaveText("Replace your saved plan for AY26 · Y1T2?");
  await expect(keep).toBeFocused();
  await keep.click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("BACMODS-7KQ2X");
  await expect(added).toHaveCount(0);

  await load.click();
  await setup.getByRole("button", { name: "Replace my plan" }).click();
  await expect(setup).toBeHidden();
  await expect(added).toBeVisible();

  // The same plan again changes nothing, so it loads without asking.
  await page.getByRole("button", { name: /^Plan: BAC,/ }).click();
  await input.fill("BACMODS-7KQ2X");
  await load.click();
  await expect(setup).toBeHidden();
});

test("a share link asks before replacing a saved plan", async ({ page }) => {
  await startPlanningAt(page, "/modules");
  await page.goto("/?share=BACMODS-7KQ2X");
  await page.getByRole("button", { name: "Keep my plan" }).click();
  await expect(page).toHaveURL(/\/modules$/);
  await expect(page.getByRole("button", { name: "Add INF2006" })).toBeVisible();

  await page.goto("/?share=BACMODS-7KQ2X");
  await page.getByRole("button", { name: "Replace my plan" }).click();
  await expect(page).toHaveURL(/\/modules$/);
  await expect(page.getByRole("button", { name: "Remove INF2006" })).toBeVisible();
});

test("an unknown direct share link shows the field error and preserves the entered code", async ({ page }) => {
  await page.goto("/?share=BACMODS-ZZZZZ");
  const input = page.getByRole("textbox", { name: "Share code" });
  await expect(input).toHaveValue("BACMODS-ZZZZZ");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(invalidCode);
  await expect(page.getByRole("alert").filter({ hasText: invalidCode })).toBeVisible();
});

test("clipboard feedback stays visible and announced in the share dialog", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await startPlanningAt(page, "/export");
  await page.getByRole("button", { name: /^Share code/ }).click();
  const share = page.getByRole("dialog", { name: "Share your plan" });
  const status = share.getByRole("status");
  await expect(status).toHaveAttribute("aria-live", "polite");
  await share.getByRole("button", { name: "Copy share code" }).click();
  await expect(status).toHaveText("Share code copied");
  await expect(status).toBeInViewport();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("BACMODS-7KQ2X");

  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error("Clipboard unavailable"); };
  });
  await share.getByRole("button", { name: "Copy link" }).click();
  await expect(status).toHaveText("Couldn't copy. Select the text and copy it yourself.");
  await expect(status).toBeInViewport();
});

test("going offline explains and disables code sharing until the connection returns", async ({ page, context }) => {
  await startPlanningAt(page, "/export");
  await page.getByRole("button", { name: /^Share code/ }).click();
  const share = page.getByRole("dialog", { name: "Share your plan" });
  const copy = share.getByRole("button", { name: "Copy share code" });
  await expect(copy).toBeEnabled();
  await context.setOffline(true);
  await expect(share.getByRole("status")).toHaveText(offline);
  await expect(copy).toBeDisabled();
  await expect(copy).toHaveAccessibleDescription(offline);
  await context.setOffline(false);
  await expect(copy).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(share).toBeHidden();

  await page.getByRole("button", { name: /Plan: BAC, AY26/ }).click();
  const setup = page.getByRole("dialog", { name: "Your plan" });
  const input = setup.getByRole("textbox", { name: "Share code" });
  const load = setup.getByRole("button", { name: "Load plan" });
  await input.fill("BACMODS-7KQ2X");
  await context.setOffline(true);
  await expect(setup.getByRole("status")).toHaveText(offline);
  await expect(input).toBeDisabled();
  await expect(input).toHaveAccessibleDescription(offline);
  await expect(load).toBeDisabled();
  await expect(setup.getByRole("button", { name: "Update plan" })).toBeEnabled();
  await context.setOffline(false);
  await expect(input).toBeEnabled();
  await expect(load).toBeEnabled();
  await load.click();
  await setup.getByRole("button", { name: "Replace my plan" }).click();
  await expect(setup).toBeHidden();
  await expect(page.getByRole("listitem").filter({ hasText: "INF1107" }).getByText("LAB P2")).toBeVisible();
});

async function expectReadableLanes(grid: Locator, labels: string[]) {
  await grid.scrollIntoViewIfNeeded();
  const boxes = await Promise.all(labels.map(async (label) => {
    const block = grid.getByRole("img", { name: new RegExp(`^${label},.*clash$`) });
    await expect(block).toBeInViewport({ ratio: 1 });
    const [code, ...section] = label.split(" ");
    for (const text of [code, section.join(" ")]) {
      const clipped = await block.getByText(text, { exact: true }).evaluate(
        (node) => node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight,
      );
      expect(clipped, `${text} fits in its block`).toBe(false);
    }
    return (await block.boundingBox())!;
  }));
  boxes.sort((a, b) => a.x - b.x);
  expect(Math.max(...boxes.map((b) => b.y))).toBeLessThan(Math.min(...boxes.map((b) => b.y + b.height)));
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i - 1].x + boxes[i - 1].width).toBeLessThanOrEqual(boxes[i].x);
  }
}

test("the desktop preview and timetable fit two and three concurrent class labels", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, "The live week preview starts at 1024 px");
  await startPlanningAt(page, "/modules");
  await page.getByRole("button", { name: "Add BAC4000A" }).click();
  const preview = page.getByRole("complementary", { name: "Week preview" });
  const previewGrid = preview.getByRole("group", { name: "Week timetable" });
  const pair = ["INF1107 LEC ALL", "BAC4000A WKS W1"];
  await expectReadableLanes(previewGrid, pair);

  const programming = page.getByRole("region", { name: "INF1105" });
  await programming.getByRole("button", { name: /Tutorial · pick one/ }).click();
  await programming.locator("label", { hasText: "T3" }).click();
  await preview.getByRole("button", { name: "Next week" }).click();
  const trio = [...pair, "INF1105 TUT T3"];
  await expectReadableLanes(previewGrid, trio);

  await page.getByRole("link", { name: "Timetable" }).click();
  await expect(page).toHaveURL(/\/timetable$/);
  const screen = page.getByRole("main").filter({ has: page.getByRole("heading", { name: "Timetable", level: 1 }) });
  const timetable = screen.getByRole("group", { name: "Week timetable" });
  await expectReadableLanes(timetable, trio);
  await page.getByRole("button", { name: "Previous week" }).click();
  await expectReadableLanes(timetable, pair);
});

test("Monday to Friday fit a 360 px week view without cutting off labels", async ({ page }) => {
  test.skip(page.viewportSize()?.width !== 390, "Sets its own narrow width, so one project is enough");
  await page.setViewportSize({ width: 360, height: 760 });
  await startPlanningAt(page, "/timetable");
  await page.getByRole("button", { name: "Week", exact: true }).click();
  const grid = page.getByRole("group", { name: "Week timetable" });
  await expect(grid.getByRole("img", { name: /^AAI1001 TUT ALL/ })).toBeInViewport({ ratio: 1 });
  expect(await grid.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
  expect(await clippedLabels(grid)).toEqual([]);
});

function clippedLabels(grid: Locator) {
  return grid.locator(".truncate").evaluateAll((labels) =>
    labels.filter((label) => label.scrollWidth > label.clientWidth).map((label) => label.textContent));
}

test("a day with an eight-character module code widens so the code stays whole", async ({ page }) => {
  test.skip(page.viewportSize()?.width !== 390, "Sets its own narrow width, so one project is enough");
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/");
  await page.getByRole("combobox", { name: "Intake" }).selectOption("AY25");
  await page.getByRole("button", { name: "Start planning" }).click();
  await page.getByRole("button", { name: "Add BAC4000A" }).click();
  await expect(page.getByRole("button", { name: "Remove BAC4000A" })).toBeVisible();
  await page.getByRole("link", { name: "Timetable" }).click();
  await page.getByRole("button", { name: "Week", exact: true }).click();
  const grid = page.getByRole("group", { name: "Week timetable" });
  await expect(grid.getByRole("img", { name: /^BAC4000A/ })).toBeVisible();
  expect(await clippedLabels(grid)).toEqual([]);
});
