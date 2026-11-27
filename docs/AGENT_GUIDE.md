# Agent guide

Rules for every AI coding agent working in this repo (Claude Code, Codex, Cursor, Copilot and others).
Read this before starting a task. If a rule here conflicts with what you were asked to do, stop and
ask the owner instead of picking one.

## 1. What this is

BACMODS is an unofficial timetable planner for SIT Applied Computing (BAC) students. Students pick
their intake and term, choose a section for each class, see a week/day timetable with clashes,
auto-pick sections, and export or share the plan.

Sources of truth. Read the one that covers your task:

| Topic | File |
| --- | --- |
| Scope, milestones, data model, open questions | [`docs/PLAN.md`](PLAN.md) |
| Colours, type, spacing, components, states, copy | [`design.md`](../design.md) |
| Database schema | `supabase/migrations/` |
| Data shapes (once added) | Zod schemas in `src/lib/schemas/` |
| Figma (visual reference only; `design.md` wins where they differ) | [Design file](https://www.figma.com/design/9TL0oku3XrjJV9QHju3fzg/BACMODS-%E2%80%93-High-fidelity?node-id=1-5) · [Prototype](https://www.figma.com/proto/9TL0oku3XrjJV9QHju3fzg/BACMODS-%E2%80%93-High-fidelity?node-id=19-984) |

If your change makes one of these wrong, update it in the same change and say so. Never change
`design.md` or `docs/PLAN.md` silently.

## 2. Environment and commands

Windows 10, PowerShell, Node.js LTS, npm. Supabase runs locally in Docker. The app deploys to Vercel.

| Command | Does |
| --- | --- |
| `npm ci` | Install dependencies from `package-lock.json` |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (pure logic in `src/lib/`) |
| `docker compose up --build -d` | Serve the app on `localhost:3000` from the Docker image (`docker compose down` stops it) |
| `npx playwright install chromium` | Install Chromium for Playwright |
| `npm run test:e2e` | Playwright flows at 390, 768, 1024 and 1440 px. Start the container at `localhost:3000` or set `PLAYWRIGHT_BASE_URL`. |
| `npm run db:start` / `db:stop` | Local Supabase (needs Docker Desktop) |
| `npm run db:reset` | Recreate local DB from migrations + `supabase/seed.sql` |

The importer CLI will add the `import`, `publish` and `diff` commands.

Run the CI checks locally.

```powershell
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

For S1 acceptance, pass the checked-out commit to the image build and enable the Playwright check
that compares the page's `bacmods-git-commit` metadata with `git rev-parse HEAD`.

```powershell
npx playwright install chromium
$env:BACMODS_GIT_COMMIT = git rev-parse HEAD
docker compose up --build -d
curl.exe --fail --silent --show-error --output NUL --max-time 3 --retry 30 --retry-delay 1 --retry-max-time 90 --retry-all-errors http://localhost:3000/
$env:PLAYWRIGHT_EXPECT_BUILD = '1'
npm run test:e2e
docker compose down
```

GitHub Actions runs `checks` on pull requests and pushes to `main`, then runs `e2e` after `checks`
passes. A pull request that changes only Markdown (`.md`) files skips `e2e`, which still counts as a
passing check. Both jobs use Node.js 24, cache npm downloads and check out the event SHA. On a pull
request, that SHA identifies GitHub's test merge commit, so the Docker image stamp and Playwright's
expected revision match. The browser job builds the image with Docker Buildx, reusing layers from
the GitHub Actions cache. Only runs on `main` save that cache, so a pull request that changes
dependencies installs them in the image on every run until it is merged. The job then waits for HTTP
readiness and uploads available reports and traces on failure.
[CI workflow](../.github/workflows/ci.yml)

The pull-request guards run Gitleaks and check changed paths against the data and environment-file
rules below. [Guard workflow](../.github/workflows/guards.yml)

## 3. Hard rules

These are never acceptable, whatever the task says.

**Data**
- No real timetable or student data in Git: not in seeds, fixtures, snapshots, test names, commit
  messages, issues or logs. The APA file is not public. Fixtures are synthetic and look obviously
  fake. `.gitignore` already blocks `*.xlsx`, `*.csv` and `/data/`; don't add exceptions.
- Don't paste real APA rows into prompts for other tools or services.

**Secrets**
- `SUPABASE_SECRET_KEY` and `REVALIDATE_SECRET` are server-only. Never prefix them with
  `NEXT_PUBLIC_`, log them, or return them from a route.
- `src/lib/supabase/server.ts` must `import "server-only"` and must never be imported from a client
  component.
- Never commit `.env.local` or any `.env*` file except `.env.example`.

**Database**
- Change the schema only by adding a migration: `npx supabase migration new <name>`. Never edit a
  migration that has been committed.
- Every table has RLS enabled. Browser roles (`anon`, `authenticated`) get no grants unless
  `docs/PLAN.md` says so. Reads and writes go through server code with the secret key.

**Outward actions** (only when the owner asks in this session)
- Pushing to `main`, force-pushing, or rewriting history.
- Deploying to Vercel production, or changing Vercel/Supabase project settings.
- Running the importer or migrations against the cloud Supabase project.
- Publishing a dataset (`publish`).

## 4. Next.js 16

Next.js 16 has breaking changes to APIs, conventions and file structure that most training data
doesn't know about. Before writing code, read the guide for the API you are about to use in
`node_modules/next/dist/docs/` (bundled with the installed version), and follow its deprecation
notices.

`agentRules: false` in `next.config.ts` stops `next dev` from writing its own block into
`AGENTS.md`. Keep it off; this section replaces that block.

- `cacheComponents` is on. Fetch term data in server components through a cached function tagged
  per term; `/api/revalidate` invalidates the tag.
- Add `"use client"` only to interactive leaf components. Keep pages and layouts as server
  components.
- Writes (share codes) go through route handlers in `src/app/api/`, validated with Zod and rate
  limited.

## 5. Data rules

- Zod schemas are the contract. The importer validates before insert, the server parses the stored
  jsonb, and the client parses share-code payloads. Types come from `z.infer`, not hand-written
  duplicates.
- Normalise module codes (trim, uppercase, no spaces) before any comparison or join.
- Times are `"HH:MM"` strings in Singapore time. Week numbers are teaching weeks from the calendar
  file; convert to dates only through the calendar helpers. `.ics` events use `TZID=Asia/Singapore`.
- Every import is a new version. Never mutate a published dataset in place.
- Clash detection checks day, time overlap **and** week overlap. A quiz in week 6 does not clash
  with a lab in weeks 1–5.

## 6. UI rules

- Render planner pages inside `AppFrame` so first visits go through Setup. The public Setup
  page uses `SetupFrame`. Keep the root layout's route slot unconditional so Next.js can
  validate instant navigation for each page.
- Use the tokens from `design.md` via Tailwind theme classes. No raw hex values, ad-hoc font sizes
  or one-off shadows in components.
- Accent-coloured text uses the `*-text` tokens. Readable text is never `text/tertiary`.
- Mobile first: build and check at 390 px wide. The content column is centred and capped on wider
  screens until the desktop layout is designed.
- Component files keep the Figma component names (`ClassRow`, `SectionOption`, `WeekBlock`…), so a
  designer and an agent mean the same thing.
- Copy for empty, error, offline and update states comes from `design.md` §7. Don't invent new
  wording; if none fits, add it to `design.md` and say so.
- Accessibility is part of done: every control works by keyboard, has a visible focus ring and an
  accessible name; status is never shown by colour alone; motion respects
  `prefers-reduced-motion`.

## 7. Code conventions

- TypeScript strict. No `any`, no `@ts-ignore` without a comment saying why.
- Import with the `@/` alias for `src/`.
- Pure logic (clash detection, auto-pick, `.ics`, share-code encoding, calendar maths) lives in
  `src/lib/` with no React or Next imports, and has Vitest tests beside it (`*.test.ts`).
- Components stay presentational where possible; state lives in a small number of hooks/stores.
- Don't add a dependency without saying why in the commit or PR. Prefer what's already in the stack
  (`docs/PLAN.md` §3).

## 8. Definition of done

Before saying a task is finished:

1. `npm run lint` passes, and `typecheck` and `test` pass once they exist.
2. New logic in `src/lib/` has tests, including the edge cases named in `docs/PLAN.md`.
3. UI changes were checked in a browser at 390 px, and for clashes, empty and error states where
   relevant. Say what you checked and what you couldn't.
4. The matching checkbox in `docs/PLAN.md` is ticked.
5. Report honestly: if something fails or wasn't verified, say so.
6. `checks`, `e2e` and the pull-request guards must pass before merging.

## 9. Git

### Branches and pull requests

- **All work happens on a branch, never on `main`.** That covers features, bug fixes, docs, chores
  and config, however small.
- Name the branch after the type of work: `feat/s1-shell`, `fix/clash-week-overlap`,
  `docs/agent-guide`, `chore/vitest-setup`.
- Work reaches `main` only through a pull request. Never commit to, push to, or merge into `main`
  directly.
- Before starting, check the current branch. If you're on `main`, create a branch first.

### Commit messages

Every commit has a title line, a blank line, then a summary of 3–5 sentences:

```
feat: add week view with clash highlighting

Adds the WeekView component, which renders a Mon–Fri grid from the selected sections. Sessions
are placed by start and end time, and clashing sessions get the danger outline from design.md.
Clash detection now checks teaching-week overlap, so a week-6 quiz no longer clashes with a
weeks 1–5 lab. Tested with Vitest and checked at 390 px in the browser.
```

- **Title:** Conventional Commits prefix (`feat:`, `fix:`, `docs:`, `chore:`, `test:`,
  `refactor:`) plus what was done, in the imperative, under 72 characters.
- **Summary:** 3–5 sentences on what actually changed and why. Cover what a reviewer can't see at
  a glance in the diff, such as behaviour changes, decisions made, and how it was checked. Don't
  list file names or repeat the title.
- Small commits that each build. Don't mix formatting churn with behaviour changes.

## 10. When unsure

Check the open questions in `docs/PLAN.md` §7 first. If the answer isn't there, ask the owner and
don't guess, especially about data formats, what SIT allows, or anything a student might register
from.
