# AI Literacy for Community Action — course site

Static site. Seven pages, no build step, no dependencies. Everything that ships lives in `src/`.

```
src/
  index.html                      course home
  module-1-foundations.html
  module-2-how-to-prompt.html     Meryem's work, included verbatim — see note below
  module-3-data-privacy.html
  module-4-reporting.html
  module-5-grant-writing.html
  module-6-ethics-bias.html
  .nojekyll                       stops GitHub trying to run Jekyll over it
  assets/
    course.css                    the whole design system
    course.js                     nav, progress, quizzes, sorters, copy buttons
    feedback.js                   the review widget
    config.js                     ← the one file you edit to turn on shared feedback
.github/workflows/pages.yml       publishes src/ on push to main
```

Open `src/index.html` in a browser to work locally. No server needed.

---

## Publishing it

This folder is the repo root.

```bash
cd "Deliverables/Tech team/05-delivery/site"
git init -b main
git add .
git commit -m "AI literacy course — review draft"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
That is the only setting to change. The workflow in `.github/workflows/pages.yml` uploads `src/`
as the site, so the course lands at the root of the Pages URL rather than under `/src/`.

Every later push to `main` redeploys. First deploy takes a couple of minutes; after that it's
under a minute.

**If the repo is public**, so is the course — which is the intent eventually, but during review
you may prefer a private repo. GitHub Pages on a private repo requires a paid plan; the free
alternative is to keep the repo private and share `src/` as a zip until you're ready to go public.

---

## The feedback widget

Bottom-right corner of every page. It captures:

| Field | How |
|---|---|
| `timestamp` | automatic |
| `reviewer` | typed once, remembered |
| `page` / `page_title` | automatic |
| `section` | auto-detected from where they were scrolled, correctable via dropdown |
| `category` | Content / Clarity / Accuracy / Tone / Design / Bug / Idea |
| `comment` | free text |
| `viewport` | automatic — catches "this is broken on my phone" |
| `sent` | whether it reached the shared sheet |

**By default everything stays in the reviewer's browser.** No backend, nothing to set up, works
offline. They click **View all → Download CSV** and send you the file. That is a perfectly workable
way to run a review round with five people, and it is the mode the site ships in.

### Collecting feedback in one place

If you'd rather every reviewer's notes land in one spreadsheet automatically, wire up a Google
Apps Script web app. Free, and it writes straight into a Google Sheet.

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
Copy the `/exec` URL it gives you.

> "Anyone" means anyone with the URL can append a row. That is acceptable for a review draft — the
> worst case is junk rows you delete. Do not reuse this endpoint for anything sensitive, and rotate
> the deployment when the review round closes.

**4.** Paste it into `src/assets/config.js`:

```javascript
window.NCAF_FEEDBACK_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
```

Commit, push. Notes now save locally *and* POST to the sheet. If the POST fails the note is still
saved and marked unsent, and the widget retries on the reviewer's next page load. Nothing is ever
lost to a flaky connection.

Export the Sheet as CSV whenever you want to work through the backlog.

---

## Editing the course

**Content** lives directly in each module's HTML. The markup is plain and repetitive on purpose —
`<section class="lesson">` with a `.section-num`, a heading, prose, and a `.done-btn` at the end.
Copy an existing block.

**Styling** is entirely in `assets/course.css`. Don't add `<style>` blocks to pages; if a module
needs something new, add a class to the shared stylesheet so the next module can use it too.

**Adding or reordering modules:** edit the `MODULES` array at the top of `assets/course.js`. The
top nav, the progress dots, the home page list and the "next module" footer all read from it.

**The sorting exercise** (Module 1, Part 4) is driven by `window.SORT_TASKS` defined inline on that
page. Each entry is `{ stem, answer: "go" | "ask" | "never", why }`. Any page can have one — add a
`#taskList` div and define the array.

### Module 2 is not ours to edit

`module-2-how-to-prompt.html` is Meryem S. Golbasi's finished module, included byte-for-byte apart
from three additions marked in a comment at the top of the file: the nav bar, the feedback script,
and that comment. It carries its own styles and its own JavaScript.

Its live practice sandbox calls an AI API and **will fail on GitHub Pages**, because an API key
cannot sit in a public HTML file. It fails gracefully — the learner sees a message and the rest of
the module works. Fixing it properly needs a small server-side proxy holding the key
(scoping item D-7), which is blocked on the hosting decision. Until then, leave it.

---

## Known gaps

- **Module 2's sandbox is inert on a static host.** See above.
- **No personalization yet.** The intake flow and profile-driven tailoring exist as a separate
  scaffold (`../app-SCAFFOLD.html` and `01-curriculum/_shared/profile-and-tailoring.js`) and have
  not been merged into these pages. Doing that is a deliberate next step, not an oversight.
- **Modules 3–6 have not been through faculty review.** Modules 1 and 3–6 are drafts by Suhan;
  Module 2 is complete. Faculty review is scheduled for 9 October.
- **Progress and feedback are per-browser.** Someone reviewing on a laptop and a phone has two
  separate sets of notes. Export from both.

---

*NCAF AI Task Force · UNC Chapel Hill · review draft, September 2026*
