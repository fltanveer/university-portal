# StudyFound — University Portal

The university-facing side of StudyFound. Admissions staff review students who applied
through the platform, manage course offerings and intakes, and make admission decisions.

Signed in as **Sarah Chen, Admissions Officer, University of Melbourne**. There is no auth
flow — the session is assumed.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

```bash
npm run build && npm run preview   # production build
```

## Stack

React 18 · Vite 5 · Tailwind CSS 3 · lucide-react · recharts. No backend — all data comes
from `src/data/mockData.js` and lives in React state, mirrored to `localStorage` so every
change survives a refresh. **Reset demo data** at the bottom of the sidebar restores the
original dataset.

## Screens

| Route | What it does |
| --- | --- |
| `/` | KPIs with real month-over-month deltas, funnel, overdue queue, country/course volume, intake deadlines |
| `/applications` | Filter, sort, search, bulk-select, saved views, CSV export |
| `/applications/:id` | Full applicant file, five tabs, decision bar, eligibility, scholarships, notes |
| `/courses`, `/courses/:id` | Course list; detail with intakes, capacity and the entry-requirements editor |
| `/scholarships`, `/scholarships/:id` | Schemes, auto-matched eligible applicants, award and revoke |
| `/communications/:tab` | Compose with live merge preview, template library, sent history |
| `/analytics` | Funnel conversion, trend, breakdowns, time-to-decision, acceptance rate |
| `/profile` | Editable public listing with a student-facing preview |

## How the moving parts connect

**Eligibility is never stored.** `src/lib/eligibility.js` scores an applicant against the
*live* requirements on the course they applied to, every render. Edit `Min GPA` on a course
and the pill on every affected applicant changes immediately — the course page shows the
resulting meets / borderline / does-not-meet split as you type. A requirement missed by a
small margin is `Borderline` rather than a hard fail; the tolerances are one table at the
top of that file.

**Intake status is derived**, not stored. Capacity, dates and an optional manual override
produce Open / Closed / Full / Not yet open. Filling the last seat marks an intake Full.

**Month-over-month deltas are real.** `stageAsOf()` in `src/lib/metrics.js` replays each
application's own timeline to reconstruct the pipeline as it stood 30 days ago, so the KPI
change figures are computed rather than invented.

**Every action writes to the timeline** with a timestamp and an actor: stage moves, document
approvals and rejections, reviewer assignment, notes, scholarship awards, emails sent.

## Deliberate decisions

- **Applicant photos are initials tiles.** A deterministic coloured monogram rather than a
  fake stock portrait — it never breaks and reads cleanly at table density. Campus photos are
  labelled gradient placeholders for the same reason.
- **Email is simulated.** Sending writes to the history log, appends to each recipient's
  timeline and shows a toast. Nothing leaves the browser.
- **Merge fields that cannot resolve are marked, not blanked.** They render as a highlighted
  `[token — not available]` so staff see the gap before sending rather than after.
- **Rejection needs a reason.** Document rejection requires selecting one and offers to
  request a replacement in the same step; application rejection captures a reason plus
  optional internal detail. Both land on the timeline.
- **Deltas are only green where growth is good.** A rising "Awaiting decision" is a backlog,
  so those tiles render neutral instead of celebrating.
- **New courses are created unlisted** with no intakes, so a half-configured course cannot
  accept applications before its requirements are set.
- **Pagination at 25 rows**, not virtualised — realistic for the data size and keeps the
  table plainly inspectable.
- **Hash routing, hand-rolled** (`src/lib/router.jsx`). Nine flat routes did not justify a
  routing dependency. List screens seed their filters from the query string, so
  `#/applications?stage=deposit_paid&course=course_3` lands pre-filtered.

## Not included

- No authentication, roles or permissions — every action runs as Sarah Chen. The "staff only"
  marking on internal notes is a label, not an access control.
- No file upload. Documents can be approved, rejected and have replacements requested, but
  there is nothing to actually upload or view; the viewer is out of scope.
- No real interview scheduling — picking a date records it and moves the stage.
- Deleting courses, scholarship schemes and templates is not wired up; courses can be
  deactivated instead.
- No server, so nothing is shared between browsers and `localStorage` is the only store.
