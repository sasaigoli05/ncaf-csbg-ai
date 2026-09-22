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
        ? '<b class="ok">All ' + total + " found.</b> " + (wrong ? "You also flagged " + wrong + " thing" + (wrong > 1 ? "s" : "") + " that were safe — over-caution costs nothing here." : "No false alarms either.")
        : "<b>" + found + " of " + total + "</b> found." + (wrong ? "  <span class=\"miss\">" + wrong + " safe word" + (wrong > 1 ? "s" : "") + " flagged.</span>" : "");
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
      actions.innerHTML = '<p class="rx-done">Nothing left to find. Notice how little of the original is usable once the identifiers are gone — that is the point.</p>';
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
     GO
     ===================================================================== */

  var KINDS = { redact: initRedact, compute: initCompute, tells: initTells, checklist: initChecklist };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-interaction]"), function (el) {
      var fn = KINDS[el.getAttribute("data-interaction")];
      if (fn) { try { fn(el); } catch (e) { el.classList.add("is-complete"); } }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
