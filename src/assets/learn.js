/* ===========================================================================
   Learn mode — the stepped card flow.

   THE IDEA (borrowed from Brilliant): show one idea, make the learner commit
   to something, then explain. Reading without committing doesn't stick; this
   forces a small act of judgment before the answer appears.

   HOW IT WORKS
   Modules are authored as ordinary scrollable documents — <section class="lesson">
   with prose and interactions inside. This file RESTRUCTURES that same DOM into
   cards at runtime. It moves the real nodes (never clones), so anything
   course.js or the interactions wired up keeps working untouched.

   Card boundaries: a new card starts at any direct child of a lesson section
   carrying [data-card]. The section's number + <h2> become a header shown on
   every card in that section, so context never scrolls away.

   Gates: a card holding an unfinished interaction won't let you continue. Gate
   state is read from the DOM rather than an event protocol — simpler, and it
   can't desynchronise from what the learner sees.

   READ MODE is the untouched document. Toggling reloads rather than tearing
   down, because a half-undone restructure is a much worse bug than a reload.
   =========================================================================== */

(function () {
  "use strict";

  var MODE_KEY = "ncaf-view-mode";           // "learn" | "read"
  var POS_KEY  = "ncaf-card-pos";            // { "<page>": index }

  function mode() {
    var fallback = window.NCAF_DEFAULT_VIEW === "read" ? "read" : "learn";
    try { return localStorage.getItem(MODE_KEY) || fallback; } catch (e) { return fallback; }
  }
  function setMode(m) {
    try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
  }
  function page() { return (location.pathname.split("/").pop() || "index.html"); }

  function readPos() {
    try { return JSON.parse(localStorage.getItem(POS_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function savePos(i) {
    var all = readPos();
    all[page()] = i;
    try { localStorage.setItem(POS_KEY, JSON.stringify(all)); } catch (e) {}
  }

  /* ---------------------------------------------------------------------
     MODE TOGGLE — injected into the top bar on every module page.
     --------------------------------------------------------------------- */

  function mountToggle(current) {
    var bar = document.querySelector(".topbar-in");
    if (!bar || document.getElementById("modeToggle")) return;

    var wrap = document.createElement("div");
    wrap.id = "modeToggle";
    wrap.className = "mode-toggle";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "View mode");
    wrap.innerHTML =
      '<button type="button" data-mode="learn"' + (current === "learn" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>Learn</button>' +
      '<button type="button" data-mode="read"'  + (current === "read"  ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>Read</button>';

    var seq = bar.querySelector(".seq");
    if (seq) bar.insertBefore(wrap, seq); else bar.appendChild(wrap);

    Array.prototype.forEach.call(wrap.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        var m = b.getAttribute("data-mode");
        if (m === current) return;
        setMode(m);
        location.reload();
      });
    });
  }

  /* ---------------------------------------------------------------------
     SLICING
     --------------------------------------------------------------------- */

  function sliceSections() {
    var sections = document.querySelectorAll("main section.lesson");
    var cards = [];

    Array.prototype.forEach.call(sections, function (sec) {
      var num = sec.querySelector(".section-num");
      var h2 = sec.querySelector(":scope > h2");
      var label = num ? num.textContent.trim() : "";
      var title = h2 ? h2.textContent.trim() : "";

      /* Everything after the header, minus:
           - the done-row (in Learn mode, advancing IS completion)
           - anything the profile has hidden, since course.js has already run
             Tailor.apply by now. Without this, a [data-if] block that does not
             apply to this agency would still claim a card and render blank. */
      var kids = Array.prototype.filter.call(sec.children, function (el) {
        if (el === num || el === h2) return false;
        if (el.classList.contains("done-row")) { el.remove(); return false; }
        if (el.hidden) return false;
        return true;
      });

      /* Explicit [data-card] always breaks. On top of that, auto-break before a
         major exhibit IF the current card already carries some prose — so a card
         reads as "a paragraph or two, then the thing it is about" rather than
         one section dumped whole. Without this, modules whose sections are mostly
         prose collapse into a handful of very long cards. */
      var EXHIBIT = ".model-card,.isnot,.compare,.risk,.horizon,.evidence,.sorter," +
                    ".checklist,.exercise,.table-scroll,.prompt-box,.ex,.quiz-q";

      var groups = [];
      kids.forEach(function (el) {
        var current = groups[groups.length - 1];
        var hasProse = current && current.some(function (n) {
          return n.tagName === "P" || n.tagName === "UL" || n.tagName === "OL";
        });
        /* Also break when the card already holds an exhibit. Without this, a run
           of exhibits with no prose between them — three self-check questions in
           a row, say — collapses into one card, and answering the first does not
           clear the gate because the other two are still pending on it. */
        var hasExhibit = current && current.some(function (n) {
          return n.matches && n.matches(EXHIBIT);
        });
        var auto = (hasProse || hasExhibit) && el.matches && el.matches(EXHIBIT);
        if (!groups.length || el.hasAttribute("data-card") || auto) groups.push([]);
        groups[groups.length - 1].push(el);
      });

      groups = groups.filter(function (nodes) {
        return nodes.some(function (n) {
          return !n.hidden && (n.textContent || "").trim().length > 0;
        });
      });

      groups.forEach(function (nodes, i) {
        cards.push({
          label: label,
          title: title,
          sectionId: sec.id || "",
          nodes: nodes,
          isFirstOfSection: i === 0,
          partCount: groups.length,
          partIndex: i
        });
      });
    });

    return cards;
  }

  /* ---------------------------------------------------------------------
     GATES — read the DOM, don't trust an event.
     --------------------------------------------------------------------- */

  function gateState(cardEl) {
    var pending = [];

    // Commit-then-reveal questions
    Array.prototype.forEach.call(cardEl.querySelectorAll(".quiz-q"), function (q) {
      if (!q.querySelector(".option.correct")) pending.push("Answer the question to continue");
    });

    // Sorting exercise — every row needs a pick
    var sorter = cardEl.querySelector(".sorter");
    if (sorter) {
      var tasks = sorter.querySelectorAll(".task").length;
      var settled = sorter.querySelectorAll(".task .why.show").length;
      if (tasks && settled < tasks) {
        pending.push("Sort all " + tasks + " to continue (" + settled + " done)");
      }
    }

    // Custom interactions mark themselves complete
    Array.prototype.forEach.call(cardEl.querySelectorAll("[data-interaction]"), function (el) {
      if (!el.classList.contains("is-complete")) {
        pending.push(el.getAttribute("data-gate-hint") || "Finish the exercise to continue");
      }
    });

    // Reveal blocks
    Array.prototype.forEach.call(cardEl.querySelectorAll("[data-reveal]"), function (btn) {
      var t = document.getElementById(btn.getAttribute("data-reveal"));
      if (t && !t.classList.contains("show")) pending.push("Have a go, then reveal the answer");
    });

    return pending;
  }

  /* ---------------------------------------------------------------------
     BUILD
     --------------------------------------------------------------------- */

  function build() {
    var main = document.querySelector("main");
    if (!main) return;

    var cards = sliceSections();
    if (cards.length < 2) return;   // nothing worth stepping through

    // Content that lives outside the lesson sections: objectives up front,
    // takeaways and the next-module footer at the end.
    var objectives = main.querySelector(".objectives");
    var takeaways = main.querySelector(".takeaways");
    var nextBlock = main.querySelector("[data-next-module]");

    var stage = document.createElement("div");
    stage.className = "learn-stage";
    stage.innerHTML =
      '<div class="learn-rail" id="learnRail"></div>' +
      '<div class="learn-viewport"><div class="learn-card" id="learnCard"></div></div>' +
      '<div class="learn-bar">' +
        '<div class="learn-bar-in">' +
          '<button class="learn-back" id="learnBack" type="button">&larr; Back</button>' +
          '<span class="learn-count" id="learnCount"></span>' +
          '<span class="learn-hint" id="learnHint"></span>' +
          '<button class="learn-next" id="learnNext" type="button">Continue &rarr;</button>' +
        '</div>' +
      '</div>';

    // Intro card: objectives. Outro card: takeaways + next.
    var deck = [];
    if (objectives) {
      deck.push({ label: "Before you start", title: "", nodes: [objectives], intro: true });
    }
    deck = deck.concat(cards);
    if (takeaways) {
      var outro = [takeaways];
      if (nextBlock) outro.push(nextBlock);
      deck.push({ label: "Wrapping up", title: "", nodes: outro, outro: true });
    }

    // Park every node in a detached holder, then place them card by card.
    var holder = document.createElement("div");
    deck.forEach(function (c) { c.nodes.forEach(function (n) { holder.appendChild(n); }); });

    main.innerHTML = "";
    main.className = "";              // the stage manages its own width
    main.appendChild(stage);
    document.body.classList.add("mode-learn");

    /* The hero is the module's title page. In Learn mode it would push the
       first card below the fold, so shrink it to a single line of context. */
    var hero = document.querySelector("header.hero");
    if (hero) {
      var kicker = hero.querySelector(".kicker");
      hero.classList.add("hero-collapsed");
      var keep = kicker ? kicker.textContent.trim() : (document.title || "");
      hero.innerHTML = '<div class="wrap"><p class="kicker">' + keep + "</p></div>";
    }

    var cardEl = document.getElementById("learnCard");
    var railEl = document.getElementById("learnRail");
    var backBtn = document.getElementById("learnBack");
    var nextBtn = document.getElementById("learnNext");
    var countEl = document.getElementById("learnCount");
    var hintEl = document.getElementById("learnHint");

    var idx = 0;
    var dir = 1;
    var saved = readPos()[page()];
    if (typeof saved === "number" && saved >= 0 && saved < deck.length) idx = saved;

    /* One segment per section, so the bar means something: you can see how many
       parts are left, not just a percentage creeping along. The current
       section's segment fills partially. */
    var segments = [];
    deck.forEach(function (c) {
      var key = c.intro ? "_intro" : c.outro ? "_outro" : (c.sectionId || c.label);
      if (!segments.length || segments[segments.length - 1].key !== key) {
        segments.push({ key: key, label: c.label || "", count: 0, start: 0 });
      }
      segments[segments.length - 1].count++;
    });
    (function () { var at = 0; segments.forEach(function (sg) { sg.start = at; at += sg.count; }); })();

    railEl.innerHTML = segments.map(function (sg) {
      return '<span class="seg" style="flex:' + sg.count + '" title="' +
             String(sg.label).replace(/"/g, "") + '"><i></i></span>';
    }).join("");

    function paintRail() {
      Array.prototype.forEach.call(railEl.children, function (el, i) {
        var sg = segments[i];
        var doneCards = Math.min(Math.max(idx + 1 - sg.start, 0), sg.count);
        var pct = (doneCards / sg.count) * 100;
        el.firstChild.style.width = pct + "%";
        el.classList.toggle("current", idx >= sg.start && idx < sg.start + sg.count);
      });
    }

    function render() {
      var c = deck[idx];
      cardEl.innerHTML = "";

      var head = document.createElement("div");
      head.className = "learn-head";
      if (c.label) head.innerHTML = '<span class="learn-label">' + c.label + "</span>";
      if (c.title) head.innerHTML += "<h2>" + c.title + "</h2>";
      if (c.label || c.title) cardEl.appendChild(head);

      var body = document.createElement("div");
      body.className = "learn-body";
      c.nodes.forEach(function (n) { body.appendChild(n); });
      cardEl.appendChild(body);

      // Multi-card sections show which part of the section you're in.
      if (c.partCount > 1) {
        var pip = document.createElement("div");
        pip.className = "learn-pips";
        for (var i = 0; i < c.partCount; i++) {
          pip.innerHTML += '<i class="' + (i === c.partIndex ? "on" : "") + '"></i>';
        }
        head.appendChild(pip);
      }

      backBtn.disabled = idx === 0;
      countEl.textContent = (idx + 1) + " of " + deck.length;
      paintRail();

      nextBtn.textContent = idx === deck.length - 1 ? "Finish module" : "Continue →";
      refreshGate();

      cardEl.classList.remove("slide-in-l", "slide-in-r");
      void cardEl.offsetWidth;                 // restart the animation
      cardEl.classList.add(dir < 0 ? "slide-in-l" : "slide-in-r");

      cardEl.scrollTop = 0;
      document.querySelector(".learn-viewport").scrollTop = 0;
      savePos(idx);
    }

    function refreshGate() {
      var pending = gateState(cardEl);
      var blocked = pending.length > 0;
      nextBtn.disabled = blocked;
      nextBtn.classList.toggle("is-blocked", blocked);
      hintEl.textContent = blocked ? pending[0] : "";
    }

    function go(n) {
      if (n < 0 || n >= deck.length) return;
      dir = n > idx ? 1 : -1;
      idx = n;
      render();
    }

    backBtn.addEventListener("click", function () { go(idx - 1); });
    nextBtn.addEventListener("click", function () {
      if (nextBtn.disabled) return;
      if (idx === deck.length - 1) { markComplete(); return; }
      go(idx + 1);
    });

    // Any interaction inside the card may have satisfied the gate.
    cardEl.addEventListener("click", function () { setTimeout(refreshGate, 0); });
    cardEl.addEventListener("input", function () { setTimeout(refreshGate, 0); });
    document.addEventListener("ncaf:interaction", refreshGate);

    document.addEventListener("keydown", function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") { if (!nextBtn.disabled) nextBtn.click(); }
      else if (e.key === "ArrowLeft") { if (!backBtn.disabled) go(idx - 1); }
    });

    function markComplete() {
      var mods = window.NCAF_MODULES || [];
      var me = mods.filter(function (m) { return m.file === page(); })[0];
      var all;
      try { all = JSON.parse(localStorage.getItem("ncaf-course-progress") || "{}") || {}; }
      catch (e) { all = {}; }
      if (me) {
        all["m" + me.n] = { parts: { all: true }, complete: true };
        try { localStorage.setItem("ncaf-course-progress", JSON.stringify(all)); } catch (e) {}
      }

      var doneCount = mods.filter(function (m) { return all["m" + m.n] && all["m" + m.n].complete; }).length;
      var next = mods.filter(function (m) { return m.n === (me ? me.n + 1 : 1); })[0];
      var pct = mods.length ? Math.round((doneCount / mods.length) * 100) : 0;

      /* Finishing should feel like finishing. A card that says "done, here is
         where you are in the course, here is what is next" does more for
         completion than a silent redirect. */
      var wrap = document.querySelector(".learn-viewport");
      wrap.innerHTML =
        '<div class="learn-card"><div class="done-screen">' +
          '<div class="done-ring" style="--pct:' + pct + '">' +
            '<span>' + doneCount + "<i>/" + mods.length + "</i></span>" +
          "</div>" +
          "<h2>" + (me ? "Module " + me.n + " complete" : "Complete") + "</h2>" +
          "<p>" + (doneCount === mods.length
            ? "That is the whole course. The takeaways from all six are gathered on one page, and the toolkit is where you use them on real work."
            : doneCount + " of " + mods.length + " modules done. Your progress is saved on this device \u2014 you can stop here and pick up later.") +
          "</p>" +
          '<div class="done-actions">' +
            (next
              ? '<a class="cta" href="' + next.file + '">Start Module ' + next.n + " \u2014 " + next.name + " \u2192</a>"
              : '<a class="cta" href="takeaways.html">See what sticks \u2192</a>') +
            '<a class="skip" href="index.html">Back to the course</a>' +
          "</div>" +
        "</div></div>";
      document.querySelector(".learn-bar").hidden = true;
      window.scrollTo(0, 0);
    }

    render();
  }

  /* ---------------------------------------------------------------------
     GO. Runs before course.js wires anything, so course.js finds the
     already-restructured DOM and binds to nodes in their final home.
     --------------------------------------------------------------------- */

  function init() {
    /* Only module pages get the card flow. Checking for section.lesson is not
       enough — the home page uses the same markup for its own sections, and
       slicing it would wipe the dashboard. The module list is the authority. */
    var here = page();
    var isModule = (window.NCAF_MODULES || []).some(function (m) { return m.file === here; })
                   && !!document.querySelector("main section.lesson");
    var m = mode();
    if (isModule) mountToggle(m);
    if (isModule && m === "learn") build();
    if (isModule && m === "read") document.body.classList.add("mode-read");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
