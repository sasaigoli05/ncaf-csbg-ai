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
  index.html                      course home
  module-1-foundations.html
  module-2-how-to-prompt.html
  module-3-data-privacy.html
  module-4-reporting.html
  module-5-grant-writing.html
  module-6-ethics-bias.html
  .nojekyll                       stops GitHub running Jekyll over it
  assets/
    course.css                    the whole design system
    course.js                     nav, progress, quizzes, sorters, copy buttons
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

### Module 2 is included as authored

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
- **No personalization yet.** A profile-driven version that tailors examples to an agency's own
  programs and systems exists as a separate prototype and has not been merged into these pages.
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
