/* ===========================================================================
   NCAF AI Literacy course — shared page behaviour.
   Nav, progress, done-buttons, quizzes, copy buttons, reveals, sorters.
   Each module page supplies only its content.
   =========================================================================== */

(function () {
  "use strict";

  var MODULES = [
    { n: 1, file: "module-1-foundations.html",  name: "Foundations",     ds: "What it is, and what it isn't",          mins: 35 },
    { n: 2, file: "module-2-how-to-prompt.html", name: "How to Prompt",   ds: "Briefing it like a new coworker",        mins: 40 },
    { n: 3, file: "module-3-data-privacy.html", name: "Data Privacy",     ds: "The line you don't cross",               mins: 35 },
    { n: 4, file: "module-4-reporting.html",    name: "CSBG Reporting",   ds: "Drafting and checking, before it ships", mins: 30 },
    { n: 5, file: "module-5-grant-writing.html", name: "Grant Writing",   ds: "Reusing what you've already written",    mins: 40 },
    { n: 6, file: "module-6-ethics-bias.html",  name: "Ethics & Bias",    ds: "Judging a tool before you adopt it",     mins: 40 }
  ];
  window.NCAF_MODULES = MODULES;

  var KEY = "ncaf-course-progress";

  function readProgress() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function writeProgress(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }
  window.NCAF_progress = readProgress;

  var progress = readProgress();
  var thisFile = location.pathname.split("/").pop() || "index.html";
  var thisMod = MODULES.filter(function (m) { return m.file === thisFile; })[0];

  /* ---------- top bar ---------- */

  function buildTopbar() {
    var host = document.querySelector("[data-topbar]");
    if (!host) return;
    var doneN = MODULES.filter(function (m) { return isModuleDone(m.n); }).length;
    var pct = Math.round((doneN / MODULES.length) * 100);
    var meter = thisMod
      ? '<span class="course-pct" title="' + doneN + ' of ' + MODULES.length + ' modules complete">' +
          '<span class="bar"><i style="width:' + pct + '%"></i></span>' + doneN + "/" + MODULES.length +
        "</span>"
      : "";

    var seq = MODULES.map(function (m) {
      var cls = m.file === thisFile ? "here" : (isModuleDone(m.n) ? "done" : "");
      return '<a class="' + cls + '" href="' + m.file + '" title="Module ' + m.n + ' — ' + m.name + '">' + m.n + "</a>";
    }).join("");
    var here = thisFile;
    host.innerHTML =
      '<div class="topbar-in">' +
        '<a class="home" href="index.html">AI Literacy for Community Action</a>' +
        '<nav class="sitenav" aria-label="Sections">' +
          '<a href="takeaways.html"' + (here === "takeaways.html" ? ' class="on"' : "") + ">Recap</a>" +
          '<a href="tools.html"' + (here === "tools.html" ? ' class="on"' : "") + ">Toolkit</a>" +
          '<a href="governance.html"' + (here === "governance.html" ? ' class="on"' : "") + ">Governance</a>" +
          '<a href="library.html"' + (here === "library.html" ? ' class="on"' : "") + ">Library</a>" +
        "</nav>" +
        meter +
        '<nav class="seq" aria-label="Modules">' + seq + "</nav>" +
      "</div>";
  }

  function isModuleDone(n) {
    var m = progress["m" + n];
    return !!(m && m.complete);
  }

  /* ---------- done buttons + progress bar ---------- */

  function wireProgress() {
    var buttons = document.querySelectorAll(".done-btn");
    if (!buttons.length || !thisMod) return;

    var key = "m" + thisMod.n;
    progress[key] = progress[key] || { parts: {}, complete: false };
    var state = progress[key];
    var fill = document.querySelector(".progress-fill");

    function refresh() {
      var n = Object.keys(state.parts).filter(function (k) { return state.parts[k]; }).length;
      state.complete = n === buttons.length;
      progress[key] = state;
      writeProgress(progress);
      if (fill) fill.style.width = (n / buttons.length) * 100 + "%";
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      var id = btn.getAttribute("data-done");
      function render() {
        var on = !!state.parts[id];
        btn.classList.toggle("is-done", on);
        btn.textContent = on ? "✓ Done" : "Mark this part done";
      }
      btn.addEventListener("click", function () {
        state.parts[id] = !state.parts[id];
        render();
        refresh();
      });
      render();
    });
    refresh();
  }

  /* ---------- quizzes ---------- */

  function wireQuiz() {
    var qs = document.querySelectorAll(".quiz-q");
    if (!qs.length) return;
    var key = "quiz-" + thisFile;
    var saved;
    try { saved = JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) { saved = {}; }

    Array.prototype.forEach.call(qs, function (q, qi) {
      var correct = q.getAttribute("data-answer");
      var fb = q.querySelector(".feedback");
      var opts = q.querySelectorAll(".option");

      function settle(picked) {
        Array.prototype.forEach.call(opts, function (o) {
          var k = o.getAttribute("data-opt");
          o.disabled = true;
          if (k === correct) o.classList.add("correct");
          else if (k === picked) o.classList.add("wrong");
        });
        if (fb) fb.classList.add("show");
      }

      Array.prototype.forEach.call(opts, function (o) {
        o.addEventListener("click", function () {
          if (saved[qi]) return;
          saved[qi] = o.getAttribute("data-opt");
          try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
          settle(saved[qi]);
        });
      });
      if (saved[qi]) settle(saved[qi]);
    });
  }

  /* ---------- copy buttons ---------- */

  function wireCopy() {
    Array.prototype.forEach.call(document.querySelectorAll(".copy-btn"), function (btn) {
      btn.addEventListener("click", function () {
        var box = btn.closest(".prompt-box");
        var target = box && box.querySelector(".copy-target");
        if (!target) return;
        var text = target.textContent.trim();
        var done = function () {
          btn.classList.add("copied");
          btn.textContent = "Copied";
          setTimeout(function () { btn.classList.remove("copied"); btn.textContent = "Copy"; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }
        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    });
  }

  /* ---------- reveal ---------- */

  function wireReveal() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]"), function (btn) {
      var target = document.getElementById(btn.getAttribute("data-reveal"));
      if (!target) return;
      btn.addEventListener("click", function () {
        target.classList.add("show");
        btn.hidden = true;
      });
    });
  }

  /* ---------- sorter (page supplies window.SORT_TASKS) ---------- */

  var LABELS = { go: "Go ahead", ask: "Check first", never: "Not this" };

  function wireSorter() {
    var host = document.getElementById("taskList");
    if (!host || !window.SORT_TASKS) return;
    var TASKS = window.SORT_TASKS;
    var scoreEl = document.getElementById("sortScore");
    var key = "sort-" + thisFile;
    var answered;
    try { answered = JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) { answered = {}; }

    function save() { try { localStorage.setItem(key, JSON.stringify(answered)); } catch (e) {} }

    function paint(choices, why, task, picked) {
      Array.prototype.forEach.call(choices.children, function (b) {
        var k = b.getAttribute("data-key");
        b.disabled = true;
        if (k === picked) b.classList.add(picked === task.answer ? "right" : "wrong");
        else if (k === task.answer) b.classList.add("reveal");
      });
      why.classList.add("show");
    }

    function updateScore() {
      var done = TASKS.filter(function (t, i) { return answered[i]; });
      if (!done.length) { if (scoreEl) scoreEl.hidden = true; return; }
      var right = TASKS.filter(function (t, i) { return answered[i] === t.answer; }).length;
      if (!scoreEl) return;
      scoreEl.hidden = false;
      scoreEl.textContent = done.length === TASKS.length
        ? "All " + TASKS.length + " sorted — " + right + " matched. The ones you would check first are worth raising at your next staff meeting."
        : right + " of " + done.length + " matched so far.";
    }

    TASKS.forEach(function (task, i) {
      var wrap = document.createElement("div");
      wrap.className = "task";

      var stem = document.createElement("p");
      stem.className = "stem";
      stem.textContent = (i + 1) + ". " + task.stem;
      wrap.appendChild(stem);

      var choices = document.createElement("div");
      choices.className = "choices";
      var why = document.createElement("p");
      why.className = "why";
      why.textContent = task.why;

      ["go", "ask", "never"].forEach(function (k) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "pick";
        b.textContent = LABELS[k];
        b.setAttribute("data-key", k);
        b.addEventListener("click", function () {
          if (answered[i]) return;
          answered[i] = k;
          save();
          paint(choices, why, task, k);
          updateScore();
        });
        choices.appendChild(b);
      });

      wrap.appendChild(choices);
      wrap.appendChild(why);
      host.appendChild(wrap);

      if (answered[i]) paint(choices, why, task, answered[i]);
    });
    updateScore();
  }

  /* ---------- next-module footer ---------- */

  function wireNext() {
    var host = document.querySelector("[data-next-module]");
    if (!host || !thisMod) return;
    var next = MODULES.filter(function (m) { return m.n === thisMod.n + 1; })[0];
    if (!next) {
      host.innerHTML =
        '<div class="txt"><h3>That is the whole course</h3>' +
        '<p>Six modules done. Back to the course home for the takeaway recap.</p></div>' +
        '<a class="go" href="index.html">Course home</a>';
      return;
    }
    host.innerHTML =
      '<div class="txt"><h3>Next: Module ' + next.n + " — " + next.name + "</h3>" +
      "<p>" + next.ds + " · about " + next.mins + " minutes</p></div>" +
      '<a class="go" href="' + next.file + '">Continue &rarr;</a>';
  }

  /* ---------- go ---------- */

  function init() {
    /* Substitute profile values and show/hide profile-conditional blocks
       before anything else renders, so nothing flashes generic copy first. */
    if (window.Tailor) { try { Tailor.apply(document); } catch (e) {} }
    buildTopbar();
    wireProgress();
    wireQuiz();
    wireCopy();
    wireReveal();
    wireSorter();
    wireNext();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
