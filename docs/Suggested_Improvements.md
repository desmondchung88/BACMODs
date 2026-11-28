# Suggested improvements

Ideas for BACMODS that aren't scheduled yet. An entry here isn't agreed scope;
[`PLAN.md`](PLAN.md) remains the source of truth for scope and milestones.

## 1. Show class details in the week view

**Status:** proposed, not started.

### Problem

A week block shows only the module code and a short class label, such as `WKS W1`.

- **Desktop:** hovering shows the browser's tooltip with the day, time and venue, but nothing
  indicates that it's there.
- **Mobile:** tapping a block does nothing. To find the time or venue, a student has to switch to
  Day view and pick the day.
- **Label:** `WKS W1` means workshop, section W1, but it can read as "week 1".

### Options

| Option | Benefit | Cost |
| --- | --- | --- |
| A. Tap or click a block to open its details | Works on every screen size and keeps the grid clean | One extra tap; moderate work |
| B. Show time and venue inside the block | Visible at a glance | Phone columns are too narrow, and one-hour blocks have no room for more lines |
| C. A everywhere, plus B where a block has room | Quick glance on desktop and full details everywhere | Most work; blocks of different sizes show different amounts |

### Proposed approach: C, in two steps

**Step 1: details on tap or click (all screen sizes).** Selecting a block opens a sheet, reusing
the existing `BottomSheet`, with:

- module code and name
- class type in full and section, such as "Workshop · W1"
- day, start time and end time
- venue, or "Venue TBA"
- teaching weeks
- the class it clashes with, if any

**Step 2: more text inside larger blocks.** Show the venue and time only when the block is wide
and tall enough. Decide this from the block's own size rather than the screen width, so narrow
clash columns stay compact. At the current 40 px per hour, a one-hour block fits only its two
existing lines, while a block of 1.5 hours has room for about four.

Step 1 closes the main gap and is useful on its own. Step 2 can follow once step 1 is checked.

### What the change needs

- Blocks become buttons that work by keyboard, with a visible focus ring and an accessible name.
- Very short classes make small tap targets, so check them on a phone.
- Update [`design.md`](../design.md) for the week block and any new wording.
- Check at 360 px, 390 px and desktop widths, including clashes and long module codes, and add
  browser tests.

### Open questions

- Should the week preview on the Modules page behave the same way?
- When a block has room for only one extra line, should it show the venue or the time?

### Delivery

A separate pull request after [#13](https://github.com/desmondchung88/BACMODs/pull/13), because
it builds on that pull request's week view changes.
