# AI Literacy for Community Action

A free, self-paced course helping Community Action Agency staff use AI safely on the
administrative work that already fills their week — and recognize where it does not belong.

Built by the NCAF AI Task Force, a student project at the University of North Carolina at Chapel
Hill, in partnership with the National Community Action Foundation, the North Carolina Community
Action Association, and the NC DHHS Office of Economic Opportunity.

**This is a review draft.** Content is still being written and reviewed and should not be treated
as final guidance. Every page carries a notice saying so.

---

## The course

| | Module | About |
|---|---|---|
| 1 | Foundations | What a generative AI tool is doing, and why it can be confidently wrong |
| 2 | How to Prompt | Briefing it like a capable new coworker |
| 3 | Data Privacy | The line you don't cross, and why it sits where it does |
| 4 | CSBG Reporting | Where AI helps with the Annual Report, and how to check the output |
| 5 | Grant Writing | Reusing your own past applications without sounding machine-written |
| 6 | Ethics & Bias | Judging a tool before you adopt it |

About four hours total, designed to be taken in thirty-minute pieces. Progress saves in the
browser — no account, no sign-in, nothing reported anywhere.

One rule runs through all six: **aggregate data and your own words are fine; anything that
identifies a person is not.** Nothing in this course asks a learner to put client information into
an AI tool.

---

## Repository layout

Static site. No build step, no dependencies. Everything that ships lives in `src/`.

```
src/
  index.html                      dashboard / course home
  setup.html                      the intake (nine questions, ~1 min)
  takeaways.html                  all 30 takeaways on one page
  tools.html                      the agency toolkit
  governance.html                 the seven guardrails, each wired to what implements it
  library.html                    index of briefs, research and guidance
  module-1-foundations.html
  module-2-how-to-prompt.html
  module-3-data-privacy.html
  module-4-reporting.html
  module-5-grant-writing.html
  module-6-ethics-bias.html
  .nojekyll                       stops GitHub running Jekyll over it
  assets/
    course.css                    the whole design system
    mode.js                       demo / full presentation mode
    course.js                     nav, progress, quizzes, sorters, copy buttons
    learn.js                      the stepped card flow + Learn/Read toggle
    interactions.js               redact / compute / tells / checklist exercises
    profile.js                    agency profile + tailoring engine
    feedback.js                   reviewer feedback widget
    draft-banner.js               the review-draft notice
    config.js                     ← the one file you edit
.github/workflows/pages.yml       publishes src/ on push to main
```

Open `src/index.html` in a browser to work locally. No server required, though a few things
(relative script paths) behave more faithfully if you serve it:

```bash
cd src && python3 -m http.server 8000
```

---

## Deploying

This folder is the repo root. Once pushed, set **Settings → Pages → Build and deployment →
Source: GitHub Actions**. That is the only setting to change.

The workflow uploads `src/` as the site, so pages land at the root of the Pages URL rather than
under `/src/`. Every later push to `main` redeploys — a couple of minutes the first time, under a
minute after that.

---

## How a module works

Modules are authored as ordinary scrollable documents. `learn.js` restructures that same markup
into **cards** at runtime, so there is one source of content and two ways to read it:

- **Learn** (default) — one idea per card, and a card holding an unfinished exercise will not let
  you continue. Borrowed from Brilliant: commit to an answer first, then get the explanation.
  Progress shows as one segment per section rather than a single creeping bar, cards slide in
  directionally, the top bar carries overall course progress, and finishing a module lands on a
  completion screen with a progress ring rather than a silent redirect.
- **Read** — the untouched document, for scanning in submission week.

The toggle sits in the top bar and is remembered per device.

**Card boundaries** are automatic. A new card starts at any element marked `data-card`, and also
before a major exhibit (`.model-card`, `.risk`, `.compare`, `.quiz-q`, `.exercise`, a table…) when
the current card already has prose in it — so cards read as "a paragraph or two, then the thing it
is about". You rarely need to mark anything by hand.

**Exercises** are declared in the HTML and wire themselves up from `interactions.js`. Each adds
`is-complete` when finished, which is what the gate reads:

| Type | Where | What it does |
|---|---|---|
| `redact` | Module 3 | Click the identifiers in a real case note. Targets are `<b data-pii="why">`. |
| `compute` | Module 4 | Recompute a reported figure and find the mismatch. `data-answer`, `data-tolerance`. |
| `tells` | Module 5 | Live scan for machine-writing markers. Runs in the browser; paste your own draft. |
| `checklist` | Module 6 | Judge a real vendor pitch against the five adoption questions. `data-verdict`. |
| `assistmap` | Module 4 | A fillable, saved workflow table the learner keeps between reporting cycles. |

`redact` does double duty: Module 3 hunts identifiers, Module 4 hunts errors in an AI draft. Set
`data-noun` and `data-done-note` to change the wording.

---

## Tailoring

`setup.html` collects an **organization** profile — name, counties, size, service model, programs,
case-management system, whether anyone uses AI today, biggest time sink, funders. It is stored in
the browser and never transmitted. There is no field for client information anywhere in the schema,
and the intake says so on its first screen.

Modules then use it two ways:

```html
<span data-slot="org.name">your agency</span>          <!-- substitution; authored text is the fallback -->
<div data-if="system:CARDS">…</div>                    <!-- shown only when it applies -->
```

Available tests: `program:`, `model:`, `system:`, `report:`, `ai:`, `staff:`, `role:`, `setup:`,
each negatable with `!`. An unknown test resolves to *shown*, so content is never lost to a typo.
Blocks that do not apply are dropped from the card deck entirely rather than rendering blank.

Skipping setup is always allowed — every module reads correctly with an empty profile.

---

## What you can change without touching code

Everything below lives in **`src/assets/config.js`**. One file, five settings, no build step —
edit, commit, push, and the deploy picks it up.

| Setting | Values | What it does |
|---|---|---|
| `NCAF_MODE` | `"demo"` / `"full"` | **Demo** hides internal and process-facing content — facilitator notes, citation blocks, "not finished yet" hedging, feedback requests — and quiets the banner. **Full** shows everything. Nothing is ever deleted; content marked `data-editorial` is hidden by a stylesheet rule, so flipping back restores it instantly. |
| `NCAF_DRAFT` | `true` / `false` | The banner at the top of every page. `false` removes it entirely. In demo mode it reads "Preview" rather than the full warning. |
| `NCAF_FEEDBACK_ENDPOINT` | URL or `""` | Empty keeps reviewer notes in their own browser (export as CSV). A Google Apps Script URL sends every note to one shared Sheet as well. |
| `NCAF_FEEDBACK_ALWAYS` | `true` / `false` | Forces the feedback widget on even in demo mode. Useful when demoing *to* reviewers. |
| `NCAF_DEFAULT_VIEW` | `"learn"` / `"read"` | What a first-time visitor gets — the stepped card flow, or the whole module as one page. Either way the toggle is in the top bar and their choice is remembered. |
| `NCAF_TAILOR_ENDPOINT` | URL or `""` | Optional server-side proxy for agency-specific generated scenarios. Empty means every module falls back to its authored text, which always works. **Never put an API key in this file — it is public.** |

### Hiding something else in demo mode

Add `data-editorial` to any element. That is the whole mechanism.

```html
<div class="callout" data-editorial>…internal note…</div>
```

### Other things that are data, not code

| Change | Where |
|---|---|
| Add, reorder or retime modules | `MODULES` array at the top of `assets/course.js` — nav, home page and "next module" all read from it |
| Add a library item | `LIBRARY` array in `library.html`; omit `href` until the document exists |
| Edit the research findings | The `.fnd` cards and `.stat-row` blocks in `library.html` — plain markup |
| Edit the takeaways recap | `RECAP` array in `takeaways.html` |
| Add a register (a saved, editable, exportable table) | Markup only: `data-interaction="register"` with `data-cols` and `data-key` |
| Change the sorting exercise | `window.SORT_TASKS` inline on the module page |
| Palette, type, spacing | Tokens at the top of `assets/course.css` |
| Card boundaries | Automatic. Add `data-card` only to force an extra break |

---

## The toolkit

`tools.html` holds six tools, each anchored so a module can deep-link to it
(`tools.html#redaction`). Five run entirely in the browser with no backend and no
per-agency cost — which is the point: the toolkit stays useful even if the hosting and
backend questions never resolve.

| Tool | Anchor | Pairs with | State |
|---|---|---|---|
| Redaction Check | `#redaction` | Module 3 | Working |
| Prompt Builder | `#prompt` | Module 2 | Working, pre-fills from the profile |
| AI-Tell Scanner | `#tells` | Module 5 | Working |
| AI Output Check | `#output-check` | Module 4 | Working |
| Reporting Assist Map | `#assist-map` | Module 4 | Working, saves per device |
| AI Tool Inventory | `#inventory` | Guardrail 1 | Working, saves per device |
| AI Incident Log | `#incidents` | Guardrail 7 | Working, saves per device |
| FNPI Validator | `#fnpi` | Module 4 | In build |

The last three registers are all one component. `data-interaction="register"` with `data-cols`
and `data-key` gives you a saved, editable, exportable table — a new one is markup only.

Tools are the same components the modules use, declared the same way
(`data-interaction="piicheck"`), so anything built for a module is one line away from being
a standalone tool and vice versa.

**FNPI Validator is the one to build next.** It is the highest-value item in the scoping
register, it has a confirmed live defect to catch, and there are twenty-four real agency
files in `Research-Statistics/` to test it against. It needs spreadsheet parsing, which is
why it is not done yet.

---

## Alignment with the policy recommendations

`governance.html` is the platform's answer to the Task Force's agency-level policy brief. It lists
the seven recommended guardrails and, for each, links the thing on this site that actually carries
it out — because a recommendation nobody can action is just a document.

| # | Guardrail | Implemented by |
|---|---|---|
| 1 | Keep an inventory of AI tools in use | AI Tool Inventory |
| 2 | Name one AI-accountable person | Setup, question 10; surfaced across the site |
| 3 | Assign someone to track changes | Named, no tool — it is an assignment, not an artifact |
| 4 | Cover generative AI in the handbook | Named, no tool yet |
| 5 | Train staff on the limits of AI output | The course itself |
| 6 | Restrict data by settings, not instruction | Redaction Check, and Module 3's account section |
| 7 | Log AI errors and corrections | AI Incident Log |

Guardrails 3 and 4 are deliberately unimplemented. A policy-language template for 4 is worth
building; 3 is a staffing decision and a tool would be theatre.

Two things from the brief now run through the whole platform:

- **"Aggregate, never infer."** AI may aggregate data the agency already collected; it may not
  infer or fill what is missing. Missing data gets flagged, not estimated. In Modules 3 and 4 and
  on the governance page.
- **The CARDS export risk.** CARDS reports export to Excel with client and caseworker names
  included unless staff remove them, and agencies record identifiers inconsistently. That is the
  most concrete data-exposure path these agencies have, and it is now Module 3's lead warning.

Module 6 also cites all three frameworks the brief screens, not just NIST — and makes the brief's
sharpest point: the NC state AI framework requires an inventory and a risk assessment, and
**it does not apply to CAAs**, since roughly 80 percent are private nonprofits. Same data, same
reporting systems, no coverage.

---

## The library

`library.html` indexes everything the project produces beyond the course. Items are listed
whether or not they are finished, with an honest status — `published`, `review`, `draft`,
`planned` — and no link until there is something real to link to.

**To add an item**, add an object to the `LIBRARY` array in that file:

```js
{
  group: "Policy recommendations",      // one of the four in ORDER
  title: "CARDS findings memo",
  status: "draft",
  href: "briefs/cards-memo.html",       // omit entirely until it exists
  desc: "One or two sentences on what it argues and who it is for.",
  for: "NC DHHS Office of Economic Opportunity"
}
```

The filters, counts and grouping all derive from that array — there is nothing else to update.

---

## The feedback widget

Bottom-right corner of every page, for use during review. It captures:

| Field | How |
|---|---|
| `timestamp` | automatic |
| `reviewer` | typed once, remembered |
| `page` / `page_title` | automatic |
| `section` | auto-detected from scroll position, correctable via dropdown |
| `category` | Content / Clarity / Accuracy / Tone / Design / Bug / Idea |
| `comment` | free text |
| `viewport` | automatic — catches "this is broken on my phone" |
| `sent` | whether it reached the shared sheet |

**By default everything stays in the reviewer's browser.** No backend, nothing to set up, works
offline. Reviewers click **View all → Download CSV** and send the file. That is the mode the site
ships in, and it is enough to run a review round with a handful of people.

### Collecting feedback in one place

To have every reviewer's notes land in one spreadsheet automatically, wire up a Google Apps Script
web app — free, and it writes straight into a Google Sheet.

**1.** Create a Google Sheet. First row, these nine headers exactly:

```
timestamp   reviewer   page   page_title   section   category   comment   viewport   sent
```

**2.** In that Sheet: **Extensions → Apps Script**. Replace everything with:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([
    d.timestamp, d.reviewer, d.page, d.page_title,
    d.section, d.category, d.comment, d.viewport, 'yes'
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**3.** **Deploy → New deployment → Web app.** Execute as *Me*. Who has access: **Anyone**.
Copy the `/exec` URL.

> "Anyone" means anyone with the URL can append a row. Acceptable for a review draft — the worst
> case is junk rows you delete. Do not reuse this endpoint for anything sensitive, and retire the
> deployment when the review round closes.

**4.** Paste it into `src/assets/config.js`:

```javascript
window.NCAF_FEEDBACK_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
```

Commit and push. Notes then save locally *and* POST to the sheet. If a POST fails the note is still
saved, marked unsent, and retried on the reviewer's next page load — nothing is lost to a flaky
connection.

---

## Editing

**Content** lives directly in each module's HTML. The markup is plain and repetitive on purpose —
`<section class="lesson">` with a `.section-num`, a heading, prose, and a `.done-btn` at the end.
Copy an existing block.

**Styling** is entirely in `assets/course.css`. Don't add `<style>` blocks to pages; if a module
needs something new, add a class to the shared stylesheet so the next module can use it.

**Adding or reordering modules:** edit the `MODULES` array at the top of `assets/course.js`. The
top nav, the home page list and the "next module" footer all read from it.

**The sorting exercise** (Module 1, Part 4) is driven by `window.SORT_TASKS` defined inline on that
page — each entry is `{ stem, answer: "go" | "ask" | "never", why }`. Any page can have one: add a
`#taskList` div and define the array.

**Removing the draft notice** when the course is final: set `NCAF_DRAFT = false` in
`assets/config.js`.

### Modules 2 and 4 are Meryem's

`module-2-how-to-prompt.html` and `module-4-reporting.html` are Meryem S. Golbasi's modules. The
content, structure and wording are hers; changes to either should come from her.

Module 4 was ported into the site shell from her standalone page, and two things there were built
rather than copied, both flagged in a comment at the top of the file: Part 5's error hunt is
clickable rather than reveal-only (the errors and data are hers, the per-error explanations were
written here because her reveal text sat behind a button and did not survive to the PDF), and the
Assist Map is a saved fillable table rather than a printed one.

### Module 2 is included byte-for-byte

`module-2-how-to-prompt.html` is Meryem S. Golbasi's finished module, included byte-for-byte apart
from four additions listed in a comment at the top of the file: the nav bar, the script tags, a
read-only progress shim, and that comment. It carries its own styles and its own JavaScript.
Changes to Module 2 should come from her.

Its live practice sandbox calls an AI API and **will not work on GitHub Pages**, because an API key
cannot sit in a public HTML file. It fails gracefully — the learner sees a message and the rest of
the module works. Making it work needs a small server-side proxy to hold the key, which is pending
a hosting decision.

---

## Known gaps

- **Module 2's practice sandbox is inert on a static host.** See above.
- **Modules 1 and 3–6 have not been through faculty review.** Scheduled for October 2026.
- **Module 4's error explanations need Meryem's review.** They were written here, not ported.
- **Tailoring is thin so far.** The engine is in place and wired, but only Modules 1, 3 and 5
  actually use it. Adding slots and conditionals to 4 and 6 is authoring work, not engineering.
- **Module 2 has no card breaks of its own**, so in Learn mode its sections become larger cards
  than the other modules'. Adding `data-card` markers would fix it, but that is Meryem's file.
- **Progress and feedback are per-browser.** Someone reviewing on a laptop and a phone has two
  separate sets of notes. Export from both.

---

## Attribution

Compiled from open-source educational material and built with volunteer contributions from Task
Force members. Provided free to the Community Action network; not sold, licensed, or operated as a
business.

Content is grounded in interviews with North Carolina Community Action Agencies conducted through
the NC DHHS Office of Economic Opportunity, guidance from leaders at the National Community Action
Foundation and the National Association for State and Community Service Programs, and the project's
literature review.

Research cited across the modules includes the caseworker assistive-chatbot randomized trial by
Nava Public Benefit Corporation with Georgetown and Cornell Universities; Levy, Chasalow and Riley
on algorithmic decision-making in the public sector; Virginia Eubanks, *Automating Inequality*; the
NIST AI Risk Management Framework; MIT Sloan Teaching & Learning Technologies on effective prompts;
and the 2026 Nonprofit AI Adoption Report.
