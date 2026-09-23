/* ===========================================================================
   Interactive exercises.

   Each component is declared in the module HTML and wires itself up here.
   All of them add class "is-complete" when finished, which is what the Learn
   mode gate reads. They all work identically in Read mode — the only
   difference is that Read mode won't stop you scrolling past.

   Four types, one per module that needs one:
     redact    — click the words that must not go into an AI tool      (M3)
     compute   — recompute a figure yourself and find the mismatch     (M4)
     tells     — paste prose, see the machine-writing markers light up (M5)
     checklist — run the adoption checklist against a real pitch       (M6)
   =========================================================================== */

(function () {
  "use strict";

  function done(el) {
    el.classList.add("is-complete");
    document.dispatchEvent(new CustomEvent("ncaf:interaction"));
  }

  /* =====================================================================
     REDACT — the case-note exercise.
     Targets are authored as <b data-pii="why">text</b>. Decoys are ordinary
     text, so a learner who clicks everything doesn't pass.
     ===================================================================== */

  function initRedact(root) {
    var body = root.querySelector("[data-redact-text]");
    if (!body) return;

    /* Same mechanic, two jobs: finding identifiers in a case note (Module 3)
       and finding errors in an AI draft (Module 4). Only the wording differs. */
    var NOUN = root.getAttribute("data-noun") || "found";
    var CLOSING = root.getAttribute("data-done-note") ||
      "Nothing left to find. Notice how little of the original is usable once the identifiers are gone — that is the point.";

    var targets = Array.prototype.slice.call(body.querySelectorAll("[data-pii]"));
    var total = targets.length;
    var found = 0;
    var wrong = 0;

    var status = document.createElement("div");
    status.className = "rx-status";
    root.appendChild(status);

    var log = document.createElement("div");
    log.className = "rx-log";
    root.appendChild(log);

    var actions = document.createElement("div");
    actions.className = "rx-actions";
    actions.innerHTML = '<button class="reveal-btn" type="button">Show me the rest</button>';
    root.appendChild(actions);

    function paint() {
      status.innerHTML = found >= total
        ? '<b class="ok">All ' + total + " " + NOUN + ".</b> " + (wrong ? "You also flagged " + wrong + " thing" + (wrong > 1 ? "s" : "") + " that were fine — over-caution costs nothing here." : "No false alarms either.")
        : "<b>" + found + " of " + total + "</b> " + NOUN + "." + (wrong ? "  <span class=\"miss\">" + wrong + " that " + (wrong > 1 ? "were" : "was") + " fine.</span>" : "");
    }

    function note(text, cls) {
      var p = document.createElement("p");
      p.className = "rx-note " + (cls || "");
      p.innerHTML = text;
      log.appendChild(p);
    }

    function hit(el) {
      if (el.classList.contains("hit")) return;
      el.classList.add("hit");
      found++;
      note("<b>" + el.textContent.trim() + "</b> — " + el.getAttribute("data-pii"), "good");
      paint();
      if (found >= total) { finish(); }
    }

    function finish() {
      done(root);
      actions.innerHTML = '<p class="rx-done">' + CLOSING + "</p>";
    }

    body.addEventListener("click", function (e) {
      if (root.classList.contains("is-complete")) return;
      var t = e.target.closest("[data-pii]");
      if (t && body.contains(t)) { hit(t); return; }
      // A click on safe text — record it, don't punish it.
      var sel = e.target.closest("span,b,em,strong,p") ;
      if (sel && body.contains(sel) && !sel.classList.contains("safe-hit")) {
        sel.classList.add("safe-hit");
        wrong++;
        paint();
      }
    });

    actions.querySelector("button").addEventListener("click", function () {
      targets.forEach(function (t) {
        if (!t.classList.contains("hit")) {
          t.classList.add("hit", "revealed");
          found++;
          note("<b>" + t.textContent.trim() + "</b> — " + t.getAttribute("data-pii"), "shown");
        }
      });
      paint();
      finish();
    });

    paint();
  }

  /* =====================================================================
     COMPUTE — recompute a reported figure and find the mismatch.
     ===================================================================== */

  function initCompute(root) {
    var answer = parseFloat(root.getAttribute("data-answer"));
    var tol = parseFloat(root.getAttribute("data-tolerance") || "0.5");
    var unit = root.getAttribute("data-unit") || "";
    var explain = root.querySelector("[data-compute-explain]");
    if (explain) explain.hidden = true;

    var box = document.createElement("div");
    box.className = "cp-box";
    box.innerHTML =
      '<label class="cp-label">Your figure' + (unit ? " (" + unit + ")" : "") + '</label>' +
      '<div class="cp-row">' +
        '<input class="cp-input" type="text" inputmode="decimal" placeholder="e.g. 41.2">' +
        '<button class="cp-check" type="button">Check</button>' +
        '<button class="skip cp-show" type="button">Show the working</button>' +
      '</div>' +
      '<p class="cp-feedback" hidden></p>';
    root.insertBefore(box, explain || null);

    var input = box.querySelector(".cp-input");
    var fb = box.querySelector(".cp-feedback");
    var tries = 0;

    function settle(msg, cls) {
      fb.hidden = false;
      fb.className = "cp-feedback " + cls;
      fb.innerHTML = msg;
    }

    function finish() {
      if (explain) explain.hidden = false;
      done(root);
      box.querySelector(".cp-check").disabled = true;
      box.querySelector(".cp-show").hidden = true;
      input.disabled = true;
    }

    box.querySelector(".cp-check").addEventListener("click", function () {
      var v = parseFloat(String(input.value).replace(/[^0-9.\-]/g, ""));
      if (isNaN(v)) { settle("Put a number in first.", "warn"); return; }
      tries++;
      if (Math.abs(v - answer) <= tol) {
        settle("That's it. Now compare it to what the file actually reports.", "good");
        finish();
      } else if (tries >= 3) {
        settle("Not quite — it's <b>" + answer + unit + "</b>. The working is below.", "warn");
        finish();
      } else {
        settle("Not yet. Check which two columns you're dividing.", "warn");
      }
    });

    box.querySelector(".cp-show").addEventListener("click", function () {
      settle("The answer is <b>" + answer + unit + "</b>.", "warn");
      finish();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); box.querySelector(".cp-check").click(); }
    });
  }

  /* =====================================================================
     TELLS — live machine-writing scanner.
     Runs entirely here in the page; the learner can paste their own draft.
     ===================================================================== */

  var TELLS = [
    { re: /\bnot just\b[^.]{0,60}?\bbut\b/gi, label: "not just X, but Y", why: "The signature construction. Pick one half and say it." },
    { re: /\b(delve|delving)\b/gi, label: "delve", why: "Almost nobody says this out loud." },
    { re: /\bleverag(e|ing|es|ed)\b/gi, label: "leverage", why: "As a verb it means “use”. Say use." },
    { re: /\brobust\b/gi, label: "robust", why: "Means strong, but vaguer. Say what is strong about it." },
    { re: /\b(tapestry|vibrant)\b/gi, label: "tapestry / vibrant", why: "Decorative. Carries no information." },
    { re: /\b(underscore|underscores|underscoring)\b/gi, label: "underscore", why: "Say shows, or proves, or just state the fact." },
    { re: /\bholistic\b/gi, label: "holistic", why: "Very common in this field and almost never specific. Name the services." },
    { re: /\btransformative\b/gi, label: "transformative", why: "A claim with no number behind it." },
    { re: /\bpivotal\b/gi, label: "pivotal", why: "Say central, or key — or cut it." },
    { re: /\b(a )?testament to\b/gi, label: "testament to", why: "Reads as filler to a tired reviewer." },
    { re: /\blandscape\b/gi, label: "landscape", why: "Unless you mean actual land, say field or sector." },
    { re: /\bcomprehensive\b/gi, label: "comprehensive", why: "Everyone says it. Show the scope instead." },
    { re: /\bdeeply committed\b/gi, label: "deeply committed", why: "Commitment is shown by numbers, not adverbs." },
    { re: /\bmay potentially\b/gi, label: "may potentially", why: "Doubled hedge. Pick one, or drop both." },
    { re: /\bmeaningful outcomes\b/gi, label: "meaningful outcomes", why: "Which outcomes? How many?" }
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
  }

  function initTells(root) {
    var seed = root.getAttribute("data-seed") || "";
    var box = document.createElement("div");
    box.className = "tl-box";
    box.innerHTML =
      '<label class="cp-label" for="tlIn">Paste a paragraph — this one, or your own draft</label>' +
      '<textarea class="field tl-in" id="tlIn" rows="5"></textarea>' +
      '<div class="cp-row" style="margin-top:.8rem">' +
        '<button class="cp-check tl-run" type="button">Scan it</button>' +
        '<span class="tl-privacy">Runs in your browser. Nothing is uploaded.</span>' +
      '</div>' +
      '<div class="tl-out" hidden></div>';
    root.appendChild(box);

    var input = box.querySelector(".tl-in");
    var out = box.querySelector(".tl-out");
    input.value = seed;

    box.querySelector(".tl-run").addEventListener("click", function () {
      var text = input.value;
      if (!text.trim()) return;

      var hits = [];
      TELLS.forEach(function (t) {
        var m = text.match(t.re);
        if (m) hits.push({ label: t.label, why: t.why, n: m.length, sample: m[0] });
      });

      var numbers = (text.match(/\b\d+(\.\d+)?%?\b/g) || []).length;
      var marked = escapeHtml(text);
      TELLS.forEach(function (t) {
        marked = marked.replace(t.re, function (m) { return '<mark class="tl-hit">' + m + "</mark>"; });
      });

      out.hidden = false;
      out.innerHTML =
        '<div class="tl-marked">' + marked + "</div>" +
        '<p class="tl-score">' +
          "<b>" + hits.length + " marker" + (hits.length === 1 ? "" : "s") + "</b> found &middot; " +
          "<b>" + numbers + " number" + (numbers === 1 ? "" : "s") + "</b> in the text." +
          (hits.length && numbers === 0
            ? " That combination — confident phrasing, no figures — is what a reviewer notices."
            : (numbers > 2 && hits.length <= 2
              ? " Specific and mostly clean. This reads as written by someone who knows the programme."
              : "")) +
        "</p>" +
        (hits.length
          ? '<ul class="tl-list">' + hits.map(function (h) {
              return "<li><b>" + escapeHtml(h.label) + "</b>" + (h.n > 1 ? " ×" + h.n : "") + " &mdash; " + h.why + "</li>";
            }).join("") + "</ul>"
          : '<p class="tl-clean">No markers. Whether it is <em>good</em> is a separate question — but it will not read as machine-written.</p>');

      done(root);
    });
  }

  /* =====================================================================
     CHECKLIST — run the five questions against a real pitch.
     Each item has data-verdict="pass|fail" and an explanation.
     ===================================================================== */

  function initChecklist(root) {
    var items = Array.prototype.slice.call(root.querySelectorAll("[data-verdict]"));
    var answered = 0;

    items.forEach(function (item) {
      var verdict = item.getAttribute("data-verdict");
      var why = item.getAttribute("data-why") || "";
      var q = item.getAttribute("data-q") || item.textContent.trim();
      item.textContent = "";
      item.className = "ck-item";
      item.innerHTML =
        '<p class="ck-q">' + q + "</p>" +
        '<div class="ck-picks">' +
          '<button type="button" data-pick="pass">They answered it</button>' +
          '<button type="button" data-pick="fail">They didn\'t</button>' +
        "</div>" +
        '<p class="ck-why" hidden>' + why + "</p>";

      var picks = item.querySelectorAll("[data-pick]");
      Array.prototype.forEach.call(picks, function (b) {
        b.addEventListener("click", function () {
          if (item.classList.contains("settled")) return;
          item.classList.add("settled");
          var right = b.getAttribute("data-pick") === verdict;
          Array.prototype.forEach.call(picks, function (x) {
            x.disabled = true;
            var k = x.getAttribute("data-pick");
            if (k === verdict) x.classList.add("truth");
            else if (x === b) x.classList.add("wrongpick");
          });
          item.querySelector(".ck-why").hidden = false;
          item.classList.add(right ? "got" : "missed");
          answered++;
          if (answered >= items.length) done(root);
          document.dispatchEvent(new CustomEvent("ncaf:interaction"));
        });
      });
    });
  }


  /* =====================================================================
     ASSIST MAP — the keepsake table. Rows persist per device so a learner
     can come back to it each reporting cycle, and it copies out as text.
     ===================================================================== */

  var MAP_KEY = "ncaf-assist-map";
  var MAP_COLS = ["Reporting step", "AI help?", "How AI helps", "Human sign-off?", "Risk or note"];

  function initAssistMap(root) {
    var seed = [];
    Array.prototype.forEach.call(root.querySelectorAll("[data-row]"), function (r) {
      seed.push(r.getAttribute("data-row").split("|"));
      r.remove();
    });

    var rows;
    try { rows = JSON.parse(localStorage.getItem(MAP_KEY) || "null"); } catch (e) { rows = null; }
    if (!Array.isArray(rows) || !rows.length) rows = seed.concat([["", "", "", "", ""], ["", "", "", "", ""]]);

    function save() {
      try { localStorage.setItem(MAP_KEY, JSON.stringify(rows)); } catch (e) {}
    }

    var wrap = document.createElement("div");
    wrap.className = "am-wrap";
    root.appendChild(wrap);

    function render() {
      var html = '<div class="table-scroll"><table class="data am-table"><thead><tr>' +
        MAP_COLS.map(function (c) { return "<th>" + c + "</th>"; }).join("") +
        '<th aria-label="Remove"></th></tr></thead><tbody>';
      rows.forEach(function (r, ri) {
        html += "<tr>" + MAP_COLS.map(function (c, ci) {
          return '<td><input class="am-in" data-r="' + ri + '" data-c="' + ci +
                 '" value="' + String(r[ci] || "").replace(/"/g, "&quot;") +
                 '" aria-label="' + c + ', row ' + (ri + 1) + '"></td>';
        }).join("") + '<td><button class="am-del" data-r="' + ri + '" type="button" aria-label="Remove row">&times;</button></td></tr>';
      });
      html += "</tbody></table></div>" +
        '<div class="am-actions">' +
          '<button class="am-add" type="button">+ Add a step</button>' +
          '<button class="am-copy" type="button">Copy as text</button>' +
        "</div>";
      wrap.innerHTML = html;

      Array.prototype.forEach.call(wrap.querySelectorAll(".am-in"), function (inp) {
        inp.addEventListener("input", function () {
          rows[+inp.getAttribute("data-r")][+inp.getAttribute("data-c")] = inp.value;
          save();
          if (rows.some(function (r) { return r.some(function (c) { return String(c).trim(); }); })) done(root);
        });
      });
      Array.prototype.forEach.call(wrap.querySelectorAll(".am-del"), function (b) {
        b.addEventListener("click", function () {
          rows.splice(+b.getAttribute("data-r"), 1);
          if (!rows.length) rows = [["", "", "", "", ""]];
          save(); render();
        });
      });
      wrap.querySelector(".am-add").addEventListener("click", function () {
        rows.push(["", "", "", "", ""]); save(); render();
      });
      wrap.querySelector(".am-copy").addEventListener("click", function () {
        var text = MAP_COLS.join("\t") + "\n" + rows.map(function (r) { return r.join("\t"); }).join("\n");
        var btn = wrap.querySelector(".am-copy");
        function ok() { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy as text"; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, ok);
        else ok();
        done(root);
      });
    }

    render();
    if (rows.some(function (r) { return r.some(function (c) { return String(c).trim(); }); })) done(root);
  }


  /* =====================================================================
     PII CHECK — the standalone redaction tool.
     Heuristic, client-side, and deliberately underclaiming: a clean result
     is a good sign, not a guarantee. A privacy tool that phoned home would
     undercut the lesson it exists to teach, so it never does.
     ===================================================================== */

  var PII = [
    { sev: "stop", label: "Social Security number", re: /\b\d{3}-\d{2}-\d{4}\b/g,
      note: "Never goes into any AI tool, on any account type." },
    { sev: "stop", label: "Date of birth", re: /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,
      note: "A full date \u2014 often a date of birth. With a county, this identifies people." },
    { sev: "stop", label: "Phone number", re: /\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
      note: "A phone number." },
    { sev: "stop", label: "Email address", re: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g,
      note: "An email address." },
    { sev: "stop", label: "Street address", re: /\b\d{1,5}\s+[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Court|Ct|Way|Circle|Cir|Boulevard|Blvd|Trail|Trl|Highway|Hwy)\b\.?/g,
      note: "A street address." },
    { sev: "stop", label: "Case or client number", re: /\b(?:case|client|file|participant|acct|account)\s*(?:no\.?|number|#|id)?\s*[:#]?\s*[A-Z]?\d{3,}\b/gi,
      note: "An identifier that links back to a person in your own system." },
    { sev: "warn", label: "Name with a title", re: /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
      note: "Looks like a person's name." },
    { sev: "warn", label: "Sensitive circumstance", re: /\b(?:single (?:mother|father|parent)|disabled veteran|undocumented|pregnant|HIV|diagnos(?:ed|is)|incarcerat(?:ed|ion)|domestic violence|eviction notice|substance use|in recovery)\b/gi,
      note: "Even with no name attached, this can identify someone in a small county." },
    { sev: "warn", label: "Exact amount", re: /\$\s?\d{1,3}(?:,\d{3})*\.\d{2}\b/g,
      note: "An amount to the cent usually comes from one household's record, not an aggregate." }
  ];

  var PII_SAMPLE =
    "Follow-up needed for Ms. Angela Rivers, case #44812, DOB 04/17/1988, currently at " +
    "214 Sycamore Street. She's a single mother of two and received $487.50 in emergency " +
    "utility assistance last month. Reachable at (828) 555-0174 or arivers@example.com.\n\n" +
    "Draft her a warm follow-up letter explaining next steps.";

  function initPiiCheck(root) {
    var box = document.createElement("div");
    box.className = "tl-box";
    box.innerHTML =
      '<label class="cp-label" for="piiIn">Paste what you are about to put into an AI tool</label>' +
      '<textarea class="field tl-in" id="piiIn" rows="7"></textarea>' +
      '<div class="cp-row" style="margin-top:.8rem">' +
        '<button class="cp-check" type="button" data-run>Check it</button>' +
        '<button class="skip" type="button" data-sample>Load an example</button>' +
        '<span class="tl-privacy">Runs in your browser. Nothing is uploaded, to us or to an AI.</span>' +
      "</div>" +
      '<div class="tl-out" hidden></div>';
    root.appendChild(box);

    var input = box.querySelector("#piiIn");
    var out = box.querySelector(".tl-out");

    box.querySelector("[data-sample]").addEventListener("click", function () {
      input.value = PII_SAMPLE;
      run();
    });
    box.querySelector("[data-run]").addEventListener("click", run);

    function run() {
      var text = input.value;
      out.hidden = false;
      if (!text.trim()) { out.innerHTML = '<p class="tl-clean">Paste something first.</p>'; return; }

      var hits = [];
      PII.forEach(function (p) {
        var m = text.match(p.re);
        if (m) {
          var uniq = m.filter(function (v, i, a) { return a.indexOf(v) === i; });
          hits.push({ sev: p.sev, label: p.label, note: p.note, found: uniq.slice(0, 5) });
        }
      });

      done(root);

      if (!hits.length) {
        out.innerHTML =
          '<div class="clear-note"><strong>Nothing obvious found.</strong> No names with titles, ' +
          "addresses, dates of birth, phone numbers or case identifiers turned up. That is a good " +
          "sign, not a guarantee \u2014 a detailed enough description can still identify someone in " +
          "a county of thirty thousand with no name attached. Read it once more yourself.</div>";
        return;
      }

      var stops = hits.filter(function (h) { return h.sev === "stop"; }).length;
      out.innerHTML =
        '<div class="clear-note" style="background:' + (stops ? "var(--rust-soft)" : "var(--marigold-soft)") +
          ";border-color:" + (stops ? "var(--rust-line)" : "#E3CFA4") + '">' +
          (stops
            ? "<strong>Do not paste this.</strong> " + hits.length + " item" + (hits.length > 1 ? "s" : "") +
              " found, " + stops + " of which identif" + (stops > 1 ? "y" : "ies") + " a person directly."
            : "<strong>Worth a second look.</strong> Nothing that names someone outright, but " +
              hits.length + " item" + (hits.length > 1 ? "s" : "") + " that could identify a household in a small service area.") +
        "</div>" +
        '<div class="findings">' + hits.map(function (h) {
          return '<div class="finding' + (h.sev === "warn" ? " warn" : "") + '">' +
            '<span class="sev">' + (h.sev === "warn" ? "Check" : "Remove") + "</span>" +
            '<span class="msg"><b>' + h.label + "</b>" + h.note + "<br>" +
            h.found.map(function (f) { return "<code>" + escapeHtml(f) + "</code>"; }).join(" ") +
            "</span></div>";
        }).join("") + "</div>";
    }
  }

  /* =====================================================================
     PROMPT BUILDER — assembles a full prompt from the parts people forget.
     Pre-fills from the agency profile where one exists.
     ===================================================================== */

  function initPromptBuilder(root) {
    var P = (window.Tailor && Tailor.profile) || null;
    var agency = (P && P.org.name) || "";
    var county = (P && P.org.counties[0]) || "";

    var FIELDS = [
      { k: "role",    label: "Who you are",          ph: "the CSBG director at " + (agency || "a Community Action Agency"), val: agency ? "the CSBG director at " + agency : "" },
      { k: "task",    label: "What you need done",   ph: "summarise our quarterly weatherization figures for the board" },
      { k: "context", label: "What it needs to know", ph: "we serve " + (county ? county + " County" : "four rural counties") + "; the board are volunteers, not programme staff", val: county ? "we serve " + county + " County" : "" },
      { k: "format",  label: "Shape of the answer",  ph: "under 150 words, plain language, most important number first" },
      { k: "guard",   label: "Guardrails",           ph: "use only the figures I paste; if something is missing say so rather than estimating", val: "Use only the figures I provide. If something is missing, say so rather than estimating. Do not invent statistics or citations." }
    ];

    var box = document.createElement("div");
    box.className = "pb-box";
    box.innerHTML = FIELDS.map(function (f) {
      return '<label class="cp-label" for="pb-' + f.k + '">' + f.label + "</label>" +
        '<textarea class="field pb-in" id="pb-' + f.k + '" rows="2" data-k="' + f.k +
        '" placeholder="' + f.ph.replace(/"/g, "&quot;") + '">' + (f.val || "") + "</textarea>";
    }).join("") +
      '<div class="cp-row" style="margin-top:1rem"><button class="cp-check" type="button" data-build>Build my prompt</button></div>' +
      '<div class="prompt-box" hidden data-result>' +
        '<span class="label">Copy this into your AI tool</span>' +
        '<span class="copy-target"></span>' +
        '<button class="copy-btn" type="button" aria-label="Copy this prompt">Copy</button>' +
      "</div>";
    root.appendChild(box);

    var result = box.querySelector("[data-result]");

    box.querySelector("[data-build]").addEventListener("click", function () {
      var v = {};
      Array.prototype.forEach.call(box.querySelectorAll(".pb-in"), function (t) {
        v[t.getAttribute("data-k")] = t.value.trim();
      });

      var parts = [];
      if (v.role) parts.push("I'm " + v.role + ".");
      if (v.context) parts.push("Context: " + v.context + ".");
      if (v.task) parts.push("I need you to " + v.task + ".");
      if (v.format) parts.push("Format: " + v.format + ".");
      if (v.guard) parts.push(v.guard);
      parts.push("If any part of this is unclear, ask me before you start.");

      result.hidden = false;
      result.querySelector(".copy-target").textContent = parts.join("\n\n");
      done(root);
    });

    /* course.js wires .copy-btn on load; this one appears later. */
    result.querySelector(".copy-btn").addEventListener("click", function () {
      var btn = result.querySelector(".copy-btn");
      var text = result.querySelector(".copy-target").textContent;
      function ok() { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, ok);
      else ok();
    });
  }

  /* =====================================================================
     OUTPUT CHECK — Meryem's pre-submission checklist, as a working tool.
     Resets per submission; remembers nothing between runs on purpose.
     ===================================================================== */

  function initOutputCheck(root) {
    var boxes = root.querySelectorAll('input[type="checkbox"]');
    var status = document.createElement("div");
    status.className = "oc-status";
    root.appendChild(status);

    var actions = document.createElement("div");
    actions.className = "am-actions";
    actions.innerHTML = '<button class="am-add" type="button" data-reset>Start a new check</button>';
    root.appendChild(actions);

    function paint() {
      var n = 0;
      Array.prototype.forEach.call(boxes, function (b) { if (b.checked) n++; });
      var all = n === boxes.length;
      status.className = "oc-status" + (all ? " ok" : "");
      status.innerHTML = all
        ? "<b>All " + boxes.length + " checked.</b> This section is ready for a named person to sign off."
        : "<b>" + n + " of " + boxes.length + "</b> checked. Until every box is ticked, this section is not ready to submit.";
      if (all) done(root);
    }

    Array.prototype.forEach.call(boxes, function (b) { b.addEventListener("change", paint); });
    actions.querySelector("[data-reset]").addEventListener("click", function () {
      Array.prototype.forEach.call(boxes, function (b) { b.checked = false; });
      root.classList.remove("is-complete");
      paint();
    });
    paint();
  }

  /* =====================================================================
     GO
     ===================================================================== */

  var KINDS = { redact: initRedact, compute: initCompute, tells: initTells,
                checklist: initChecklist, assistmap: initAssistMap,
                piicheck: initPiiCheck, promptbuilder: initPromptBuilder,
                outputcheck: initOutputCheck };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-interaction]"), function (el) {
      var fn = KINDS[el.getAttribute("data-interaction")];
      if (fn) { try { fn(el); } catch (e) { el.classList.add("is-complete"); } }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
