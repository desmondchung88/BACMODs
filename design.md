# BACMODS design system

## 1. Identity

BACMODS uses a compact, light interface for comparing modules, class sections and times. On the Modules screen, the module code and credit count lead each card. The full name, meeting time and venue sit below in smaller, quieter text. On the Timetable screen, a module keeps its color as it moves between a chip, a day event and a week block. Blue identifies actions and the active navigation tab. Thin dividers keep dense lists readable.

> **This file is the single source of truth for the BACMODS design.** Where it differs from the Figma file, this file wins. Figma is a visual reference for layout and flows only, and is not kept in sync. Change the design by changing this file.

The Figma file covers four flows: Start & setup, Modules, Timetable and Export. All screen frames are 390 px wide. Values below were taken from its local styles and component and screen layers, then corrected and extended here. Desktop and hover guidance is marked as a recommendation. [Mobile prototype](https://www.figma.com/proto/9TL0oku3XrjJV9QHju3fzg/BACMODS-%E2%80%93-High-fidelity?node-id=19-984) · [Design file](https://www.figma.com/design/9TL0oku3XrjJV9QHju3fzg/BACMODS-%E2%80%93-High-fidelity?node-id=1-5)

## 2. Color

These are the 29 named local paint styles. Paired entries list the foreground or accent first and its pale background second. Each named paint is solid at 100% opacity.

| Figma paint style | Hex | Role |
| --- | --- | --- |
| `primary/600` · `primary/50` | `#2D4BD8` · `#EEF1FD` | Main action, active tab, focused border · light accent surface |
| `text/primary` | `#111827` | Headings, module codes, entered values |
| `text/secondary` | `#6B7280` | Supporting copy, labels and neutral icon strokes |
| `text/tertiary` | `#9CA3AF` | Placeholder text and disabled select values |
| `text/on-primary` | `#FFFFFF` | Text on a filled primary action |
| `border/default` | `#E5E7EB` | Field outlines, card boundaries and dividers |
| `surface/page` · `surface/card` | `#F7F7F8` · `#FFFFFF` | Page background · cards, fields and menus |
| `danger/600` · `danger/50` | `#DC2626` · `#FEE2E2` | Invalid input and clash indicators · clash badge fill |
| `success/600` · `success/50` | `#16A34A` · `#DCFCE7` | Clear or fitting schedule · Fits badge fill |
| `warning/600` · `warning/50` | `#B45309` · `#FEF3C7` | Warning text or icon · warning surface |
| `module/blue` · `module/blue-50` | `#4263EB` · `#EDF2FF` | Blue module accent and tint |
| `module/purple` · `module/purple-50` | `#7048E8` · `#F3F0FF` | Purple module accent and tint |
| `module/green` · `module/green-50` | `#2B8A3E` · `#EBFBEE` | Green module accent and tint |
| `module/orange` · `module/orange-50` | `#D9480F` · `#FFF4E6` | Orange module accent and tint |
| `module/pink` · `module/pink-50` | `#C2255C` · `#FFF0F6` | Pink module accent and tint |
| `module/teal` · `module/teal-50` | `#0C8599` · `#E3FAFC` | Teal module accent and tint |
| `module/slate` · `module/slate-50` | `#475569` · `#F1F5F9` | Slate module marker and its available tint |

Scrims use `#111827` at 12% or 40% over the underlying screen.

### Text on tinted fills

Several accents are too light to read as small text on their own pale tint (WCAG AA needs 4.5:1; the timetable uses 10–12 px text). Add these **text tokens** and use them wherever an accent colour is used for text on its tint or on white. Keep the original accent for dots, left borders, outlines and icons. These tokens exist only in this file, not in Figma.

| New token | Hex | Replaces as text colour | Contrast on its tint |
| --- | --- | --- | ---: |
| `success/text` | `#15803D` | `success/600` (3.0:1) | 4.6:1 |
| `danger/text` | `#B91C1C` | `danger/600` (4.0:1) | 5.3:1 |
| `module/blue-text` | `#3B5BDB` | `module/blue` (4.5:1, fails at small size) | 5.1:1 |
| `module/green-text` | `#237032` | `module/green` (4.1:1) | 5.7:1 |
| `module/orange-text` | `#C2410C` | `module/orange` (4.0:1) | 4.8:1 |
| `module/teal-text` | `#0B7285` | `module/teal` (4.0:1) | 5.2:1 |

Purple (5.0:1), pink (5.1:1), slate (6.9:1), primary (6.0:1) and warning (4.5:1) already pass and keep one colour for both roles. `danger/600` stays for input borders and the clash outline, and on white it passes (4.8:1) for the input helper text.

**`text/tertiary` is for placeholders and disabled values only** (2.4:1 on the page background). Text that must be read, including the "planning tool only" disclaimer and the dataset version line, uses `text/secondary` (4.5:1 on the page, 4.8:1 on cards).

### Banner variants

Banner **Success** uses the success pair, and an **Info** variant uses the primary pair for neutral notices such as "A new timetable version was published". (Figma's Banner Success is blue; that is outdated.)

### Module colour assignment

The library has six module accents plus slate. Assign them like this:

1. Walk the Modules list in display order: Mandatory · with choice, Mandatory · no choice, Optional, then modules the student added.
2. Give each module the first colour not yet used, in this order: blue, purple, green, orange, pink, teal, slate.
3. From the eighth module on, start the order again from blue.
4. Store each colour with the plan, so a module keeps its colour when another is added or removed, and the colour comes back with a share code.

The module code is always shown next to the colour, so two modules sharing a colour stay distinguishable. The colours in the prototype are illustrative and do not follow this order.

## 3. Typography

The 11 local styles and the text runs in the screens and components use **Inter**. All are upright, with no decoration, paragraph indent or paragraph spacing. Tracking is a percentage of font size. For CSS, −1% is `-0.01em` and +4% is `0.04em`.

| Figma style | Size | Weight | Line height | Tracking | Case |
| --- | ---: | --- | ---: | ---: | --- |
| Heading | 18 px | 600 Semi Bold | 130% | 0% | As written |
| Wordmark | 16 px | 700 Bold | 140% | -1% | As written |
| Title | 15 px | 600 Semi Bold | 140% | 0% | As written |
| Body | 14 px | 400 Regular | 140% | 0% | As written |
| Body Medium | 14 px | 500 Medium | 140% | 0% | As written |
| Small | 12 px | 400 Regular | 140% | 0% | As written |
| Small Medium | 12 px | 500 Medium | 140% | 0% | As written |
| Label | 11 px | 600 Semi Bold | 140% | +4% | Uppercase |
| Caption | 11 px | 400 Regular | 140% | 0% | As written |
| Micro | 10 px | 600 Semi Bold | 130% | 0% | As written |
| Micro Regular | 10 px | 400 Regular | 130% | 0% | As written |

Use Heading for screen headings, Title for the next level, and Label for short field or group labels such as PROGRAMME. Micro styles carry compact timetable information. Retain Body or Small for instructions and choices that must be read in full.

## 4. Spacing and Layout

The file defines spacing on auto-layout frames. **Use 4 px as a working base** for new layouts. The source also uses smaller and off-grid values for badges, calendar cells and alignment. Measurements below are in px.

| Property | Values found on component and screen layers |
| --- | --- |
| Padding on individual edges | 0, 1, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 40, 56 |
| Item spacing | 0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 24 |
| Explicit cross-axis spacing | 0 |
| Corner radii | 0, 2, 4, 6, 7, 8, 10, 12, 16, 999 |

- **Page shell.** The mobile header is 390 × 56 with 16 px side padding. The tab bar is 390 × 41, with the same inset and 24 px between tabs. A 358 px day event fits between the two 16 px page gutters. Longer module lists scroll vertically.
- **Controls.** The base Button is 36 px high with 16 px side padding and an 8 px radius. The first-visit primary action is taller. Text input is 40 px high before helper text. Context pill is 32 px high with an 8 px radius. Intake and Trimester share a row with a 12 px gap.
- **Timetable.** Day tab is 44 px high with a 10 px radius. Week block uses a 6 px radius and a 1 px internal gap. Free gap has a 56 px leading inset to align with the event column.
- **Radii by shape.** The sheet handle uses 2 px, chips 4 px, the clash outline 7 px and Setup sheet 12 px. Share sheet has 16 px top corners and square bottom corners. Status badges use 999 px for a full pill.
- **Wider screens.** The phone layout above is the base. How it grows is specified in *Responsive layout* below.

### Responsive layout

One set of components serves every width. Breakpoints are the Tailwind defaults, and the layout changes only at these two:

| Width | Name | Layout |
| --- | --- | --- |
| below 768 px | Phone | Exactly the layout described above: one column, up to 480 px wide and centred, Header with the tab bar as a second row. |
| 768–1023 px | Tablet | The same single column, capped at 720 px and centred. The Header and tab bar keep the phone arrangement. Extra width goes to the week grid and to long module names. |
| 1024 px and up | Desktop | Described below. |

**Desktop (1024 px and up)**

- **Header.** Spans the full width, with its content capped at 1280 px and centred, 24 px side padding. One row: wordmark, then the Timetable · Modules · Export tabs, then the context pill at the right. The separate tab row is not shown. The tab order, active blue text and underline are unchanged.
- **Content.** Capped at 1280 px and centred, 24 px side padding, on the page background.
- **Timetable.** The week grid uses the full content width. Week is the default view, until the student picks Day or Week, which is then remembered. Day view stays available with the same Day / Week control.
- **Modules.** Two columns with a 24 px gap. The left column (26–30 rem wide, 416–480 px) holds the summary, Auto-pick, module cards and Add a module. The right column is a live week preview: the week switcher and the same week grid as the Timetable screen, sticky at the top of the viewport while the left column scrolls. Picking a section updates the preview at once, and clashes show there with the same outline and icon. The preview is not shown below 1024 px.
- **Export.** Two columns: the section list on the left, the export tiles (calendar, share code) on the right.
- **Setup.** Stays a compact centred card, 480 px wide, on the page background, with its own white surface, 12 px radius and 1 px border.
- **Sheets.** The Setup sheet and Share sheet open as centred dialogs, 480 px wide at most, with 12 px radius (16 px for the Share sheet) on all four corners and no drag handle. They keep the same content, scrim, focus trap and Escape behaviour.
- **Hover.** The hover states in §7 apply on desktop.

## 5. Depth and Motion

| Figma effect style | CSS box-shadow | Application |
| --- | --- | --- |
| `Shadow/Popover` | `0 8px 24px 0 rgb(17 24 39 / 12%), 0 1px 2px 0 rgb(0 0 0 / 6%)` | Lift an open menu or setup sheet above the underlying controls |
| `Focus/Ring` | `0 0 0 3px rgb(45 75 216 / 18%)` | Pair with the primary-blue border on focused inputs and open selects |
| `Shadow/Small` | `0 1px 2px 0 rgb(17 24 39 / 10%)` | Subtle elevation on the selected segment |

Screen interactions use Figma Smart Animate at **200 ms ease-out** and Dissolve at **150 or 200 ms ease-out**. For reduced-motion preferences, show the destination state immediately and preserve keyboard focus.

## 6. Components

The Components page contains **42 named components and component sets**, counting a set once. Names below preserve Figma spelling and capitalization. [Component library](https://www.figma.com/design/9TL0oku3XrjJV9QHju3fzg/BACMODS-%E2%80%93-High-fidelity?node-id=1-4)

| Group | Figma names |
| --- | --- |
| Navigation and setup | Header, Context pill, Tab item, Tab bar, Setup sheet |
| Inputs and feedback | Button, Select field, Text input, Dropdown, Menu item, Banner, Toast |
| Module planning | Chip, Status badge, Class row, Section option, Auto-pick menu, Search result |
| Timetable | Week switcher, Segmented control, Day tab, Clash status, Day event, Free gap, Week block |
| Export and sharing | Section row, Export tile, Share sheet |
| Icons | Icon/chevron-down, Icon/chevron-up, Icon/chevron-left, Icon/chevron-right, Icon/check, Icon/alert-circle, Icon/link, Icon/lock, Icon/plus, Icon/map-pin, Icon/calendar, Icon/share, Icon/copy, Icon/external-link |

## 7. States

On a first visit to any planner page, open Setup before showing the timetable, module choices
or export controls. After the student confirms their programme, intake and trimester or loads
a valid share code, return to the requested page. A saved plan or a valid share link supplies
the setup automatically. Starting from the home page opens Modules after setup.

| State | Source treatment and implementation guidance |
| --- | --- |
| Hover | **Applies on desktop (1024 px and up) and wherever a pointer hovers.** On an available menu row or secondary button, use the page-gray fill. Keep a selected tab’s underline in place on pointer entry. Expose every action to touch and keyboard users. |
| Focus and open | Focused Text input and open Select field use a white fill, primary-blue stroke and Focus/Ring. **Recommendation:** apply the ring on keyboard focus for buttons, tabs and section choices, and restore focus to the trigger when a menu or sheet closes. |
| Pressed | The primary Button uses 85% opacity. The secondary Button changes to the page-gray fill. Both retain their dimensions. |
| Disabled | Both Button types use 40% opacity. Disabled Select field keeps its label, uses a page-gray box, default border and tertiary value text. Use the native disabled state where available. |
| Error | Text input keeps the entered value, switches its border to danger red and reveals a red helper below. Associate the message with the input so a keyboard or screen-reader user can recover from an invalid share code. |
| Selected and fixed | The active navigation tab uses blue text and an underline. Class row distinguishes Fixed, Choice and Choice open. Preserve the lock for fixed classes and the chevron for choices. |
| Schedule clash | Section option has a Clash variant, Search result has Addable, Clash and In plan, and Clash status has OK and Clash. Keep the status text visible alongside its color so the user can distinguish a conflict from a module’s own red-adjacent accent. |

The following states are not drawn in Figma. Build them from existing components as described.

| State | Treatment |
| --- | --- |
| Loading | Keep the Header and Tab bar in place. Show page-gray placeholder blocks in the shape of the cards or the timetable grid. No spinner for loads under about 300 ms. |
| No dataset for the chosen term | On Setup, the Trimester select lists only terms with a published dataset. If a saved plan points at a term with none, show a warning Banner: "Timetable for Y1T3 isn't out yet" with a "Go to setup" link. |
| New dataset version | Info Banner on the Modules and Timetable screens: "Timetable updated on [date]". If a chosen section no longer exists, its Class row shows the warning pair and "Section removed — pick again" when alternatives exist, or "No sections available" when the lesson type has no sections. |
| Offline | The last loaded plan and dataset stay usable. Show a Toast "You're offline. Showing saved timetable". Share code import and Copy share code are disabled with that reason in the helper text. |
| Invalid share code | Covered by the Text input Error state. Message: "That code doesn't match a saved plan. Check it and try again." |
| Curriculum unavailable | Show an Info Banner on Modules: "Curriculum for AY25 · Y1T2 is unavailable. You can still add modules below." Use the current intake and term. Keep module search available. |
| No modules this term | Modules screen shows the empty Optional card treatment ("No optional modules in Y1T2.") for each empty group. |
| Saturday classes | Day tabs show Mon–Fri. Add a Sat tab, and a Sat column in Week view, only when the plan has a Saturday session that term. |

## 8. Class types

Class rows use the full name with a section ("Laboratory · pick one", "Quiz · Q1"). Chips, week blocks and section lists use the uppercase short form with the section ("LAB P3", "LTR ALL"). Day events use the full name ("Lectorial · ALL").

| Full name | Short form | Example section |
| --- | --- | --- |
| Lecture | LEC | ALL |
| Lectorial | LTR | ALL |
| Tutorial | TUT | T7 |
| Laboratory | LAB | P3 |
| Quiz | QUIZ | Q1 |
| Workshop | WKS | W1 |

"ALL" means one section for the whole cohort, shown with the lock icon as a fixed class. These are the types in the prototype; confirm them against the APA timetable and add any others here before building.

## 9. Rules

- Keep programme, intake and trimester together in the header context control so users can check which plan they are viewing.
- Preserve the navigation order **Timetable → Modules → Export** and keep the active destination visible in each view, in every layout (a second row on phone and tablet, in the Header on desktop).
- Give the schedule more room before changing anything else as the screen widens. Don't shrink instructional text to make a wider layout fit (see the last rule).
- Carry a module’s assigned accent and code across chips, day events and week blocks. The library provides six color variants for those components. Slate is an additional paint pair. Assign colours as described under Module colour assignment.
- Use the text tokens for any accent-coloured text. Never set readable text in `text/tertiary`.
- Keep the fixed lecture and the selectable tutorial or lab visually distinct. Show the class type, section, time and venue close together when a choice can change the schedule.
- Reserve heavier elevation for overlays. Use the existing dividers and outlines to separate ordinary rows and cards.
- Avoid shrinking instructional text to timetable Micro sizes to fit a wider or narrower layout. Let labels wrap and give the schedule more room first.

## 10. Shell copy

Wording added while building the S1 shell on mock data, where §7 has no string for the case. Replace it when the prototype text is available.

| Where | Copy |
| --- | --- |
| Setup heading and intro | "Plan your BAC timetable" · "Choose your intake and trimester, pick a section for each class and spot clashes before you register." |
| Setup primary action | "Start planning" |
| Setup sheet title and action | "Your plan" · "Update plan" |
| Share code import | Field "Share code", placeholder "BACMODS-XXXXX", action "Load plan", success Toast "Plan loaded from share code" |
| Disclaimer (Setup, Modules) | "Unofficial planning tool. Check the registration system before you register." The shell adds "Sample data · version mock-1" while only mock data exists |
| Sample-data Banner (Info, Modules) | "Showing sample timetable data. Real timetables arrive in a later update." Remove when real data lands |
| Auto-pick (until built) | Toast "Auto-pick is coming soon. Your sections were not changed." |
| Calendar tile (until built) | Toast "Calendar export is coming soon." |
| Clash status | OK: "OK: no clashes" · Clash: "Clash: 1 overlap in your plan" (plural "overlaps") |
| Section option clash (below the time and venue) | "Clashes with INF1107 Lecture" · two: "Clashes with INF1107 Lecture and INF2008 Lecture" · more: "Clashes with INF1107 Lecture, INF2008 Lecture +1 more" |
| Empty day | "No classes on Monday this week." |
| Copy actions | "Section list copied" · "Share code copied" · "Link copied" · failure "Couldn't copy. Select the text and copy it yourself." |
