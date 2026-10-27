/* ===========================================================================
   The agency workspace.

   Seven widgets an agency already recognises as its own work. Each opens to
   reveal the tools inside it, and each tool is switched on or off per agency.

   Tools open as windows on a canvas. Drag them by the title bar, resize from the
   bottom-right, collapse to a bar, close to put them back in the drawer. Position,
   size and stacking are remembered.

   TO FLESH OUT A TOOL: find it in WIDGETS below and give it a `render`.
     render: "piicheck"              -> mounts that interaction component
     render: {fn: "courseProgress"}  -> calls a custom renderer from RENDERERS
     render: null                    -> shows the "not built yet" panel

   Nothing else needs changing. The toggles, persistence, state lines and
   counts all derive from this array.
   =========================================================================== */

(function () {
  "use strict";

  var KEY = "ncaf-dashboard";

  var WIDGETS = [
    {
      id: "safety", n: 1, accent: "#A2412A", name: "Keeping client data safe",
      blurb: "What may go into a tool, and the record that it did.",
      tools: [
        { id: "redaction", name: "Redaction Check", needs: "Nothing", render: "piicheck", on: true,
          what: "Paste anything before it goes into an AI tool. Flags names, addresses, dates of birth, case numbers and sensitive circumstances." },
        { id: "register", name: "AI Tool Register", needs: "Nothing", on: true,
          render: { fn: "register", key: "ncaf-ai-inventory",
                    cols: "Tool|What it is used for|Who is responsible|Client data it touches|Terms reviewed?|Trains on inputs?|Approved by|Last reviewed",
                    seed: ["ChatGPT (unpaid, personal accounts)|Drafting emails, rewriting paragraphs|Unassigned|Unknown — staff use own accounts|No|Likely|Nobody|—"] },
          what: "Every AI tool in use: what for, who owns it, what client data it touches, whether anyone read the terms, and whether it was ever approved." },
        { id: "scrubber", name: "Export Scrubber", needs: "Their file", render: null,
          what: "Upload a CARDS or Cap60 export and get it back with identifier columns stripped, plus a log of what was removed. CARDS exports carry client and caseworker names unless someone takes them out." },
        { id: "classify", name: "Data Classification Helper", needs: "Nothing", render: null,
          what: "Three questions about a file, and it tells you how sensitive it is and where it may go — so staff do not have to interpret “avoid sensitive information” themselves." },
        { id: "policy", name: "AI Policy Builder", needs: "Nothing", render: null,
          what: "Generates handbook language from the agency's own answers, covering account rules, approved tools and what may never be entered." }
      ]
    },
    {
      id: "reporting", n: 2, accent: "#2E5D4E", name: "Getting the report out",
      blurb: "Turning the four CARDS exports into the federal Annual Report.",
      tools: [
        { id: "assembler", name: "Annual Report Assembler", needs: "Their file", render: null, on: true,
          what: "Upload the four CARDS exports — performance report, OEO 240, FNPI report, All Characteristics. Fills a worksheet of the federal form's fields, shows the source export and row behind every figure, and flags fields with no source, the same number disagreeing across two exports, and blanks where a figure should exist." },
        { id: "sourcemap", name: "Field Source Map", needs: "Nothing", on: true,
          render: { fn: "register", key: "ncaf-field-source-map",
                    cols: "Federal field|Which CARDS export|Which column or row|Notes",
                    seed: ["|performance report||", "|OEO 240||", "|FNPI report||", "|All Characteristics||"] },
          what: "Which federal field comes from which CARDS export and column. The form changes shape between years and turnover is high — right now this mapping lives in one person's head." },
        { id: "outputcheck", name: "AI Output Check", needs: "Nothing", render: "outputcheck", on: true,
          what: "Run before any AI-assisted section is submitted. If a box cannot be checked, the section is not ready." },
        { id: "reconciler", name: "Figure Reconciler", needs: "Their file", render: null,
          what: "The same count appears in more than one export. Do they agree, and if not, which one goes in the report?" },
        { id: "ledger", name: "Ledger Categorizer (2A)", needs: "Their file", render: null,
          what: "Sorts a general-ledger export into the nine CSBG service domains and flags every line that does not map cleanly." },
        { id: "leveraged", name: "Leveraged Funds Reconciler (2C)", needs: "Their file", render: null,
          what: "Consolidates non-CSBG funding across LIHEAP, Head Start, state, local and private sources. Catches double-counting and empty categories." },
        { id: "calendar", name: "Reporting Calendar", needs: "Nothing", render: null,
          what: "Every CSBG deadline — annual, quarterly, monthly, organizational standards — and what is due next." },
        { id: "archive", name: "Submission Archive", needs: "Nothing", render: null,
          what: "What was filed, when, by whom, with the worksheet it came from." }
      ]
    },
    {
      id: "money", n: 3, accent: "#B0740F", name: "Finding and winning money",
      blurb: "Supplemental grants, from first search to submission.",
      tools: [
        { id: "tells", name: "AI-Tell Scanner", needs: "Nothing", render: "tells", on: true,
          what: "Marks the phrasing that reads as machine-written, and counts how many real figures you used. The second number is the one that matters." },
        { id: "boilerplate", name: "Boilerplate Bank", needs: "Nothing", on: true,
          render: { fn: "register", key: "ncaf-boilerplate",
                    cols: "Item|Text|Last updated|Used in",
                    seed: ["Mission statement|||", "Agency history|||", "Service area and counties|||", "Board composition|||", "Audit status|||"] },
          what: "Agency facts written once and reused in every application — mission, history, service area, governance, audit status." },
        { id: "pipeline", name: "Grant Pipeline Board", needs: "Nothing", render: null,
          what: "Opportunities by stage and deadline: researching, drafting, submitted, decided." },
        { id: "narratives", name: "Narrative Library", needs: "Nothing", render: null,
          what: "Past applications, tagged and searchable. The asset every other tool here draws on." },
        { id: "requirements", name: "Requirements Extractor", needs: "A server", render: null,
          what: "Paste a funder's call and get a checklist of every question, word limit and attachment." },
        { id: "reviewer", name: "Reviewer Mode", needs: "A server", render: null,
          what: "Reads your draft as a panel reviewer on their fortieth application: weakest paragraph, unbacked claims, unanswered questions." },
        { id: "budget", name: "Budget Narrative Builder", needs: "A server", render: null,
          what: "Turns a budget table into the narrative funders ask for." },
        { id: "fundermatch", name: "Funder Match", needs: "A server", render: null,
          what: "Search live grant and foundation data by topic and geography." },
        { id: "funderprofile", name: "Funder Profile Lookup", needs: "A server", render: null,
          what: "What a named foundation funds, who they have funded, and typical award size." }
      ]
    },
    {
      id: "community", n: 4, accent: "#35566B", name: "Understanding the community",
      blurb: "The needs assessment, and the data underneath it.",
      tools: [
        { id: "questionbank", name: "CNA Question Bank", needs: "Nothing", on: true,
          render: { fn: "register", key: "ncaf-cna-questions",
                    cols: "Need area|Question to ask|Asked last time?|Notes",
                    seed: ["Connectivity|Do you have reliable phone and internet at home?|No|Residents rarely volunteer this",
                           "Transport|How did you get here today?|No|Named a top barrier almost everywhere",
                           "Childcare|What would you need to take a job tomorrow?|No|",
                           "Adult day care|Is anyone at home who cannot be left alone?|No|"] },
          what: "Prompts for needs residents do not volunteer. People cannot report the absence of something they have never had." },
        { id: "samplecheck", name: "CNA Sample Checker", needs: "Their file", render: null,
          what: "Compares who answered your assessment against county figures and flags who is under-represented. A match is not proof of coverage — census undercounts poor, rural and tribal-area households." },
        { id: "snapshot", name: "Demographic Snapshot", needs: "Public data", render: null,
          what: "County-level Census and ACS figures formatted for a needs statement, with the source and vintage shown beside every number." },
        { id: "benchmark", name: "Benchmark Cards", needs: "Their file", render: null,
          what: "Your outcomes beside state and national figures, formatted for county commissioners." },
        { id: "areamap", name: "Service Area Map", needs: "Public data", render: null,
          what: "Counties served, with poverty rate, funding per capita or service gaps as the layer." },
        { id: "needcapacity", name: "Need vs Capacity", needs: "Their file", render: null,
          what: "Served against eligible population. The waitlist, made visible." },
        { id: "allocation", name: "Allocation Context", needs: "Public data", render: null,
          what: "Where your allocation sits against the other thirty agencies, per capita and in total." }
      ]
    },
    {
      id: "service", n: 5, accent: "#2F6B63", name: "Delivering and tracking service",
      blurb: "Referrals, capacity and the gaps. Counts only — nothing here reads a case record.",
      tools: [
        { id: "gaplog", name: "Gap Logger", needs: "Nothing", on: true,
          render: { fn: "register", key: "ncaf-gap-log",
                    cols: "Date|County|Need we could not meet|Why|Referred to",
                    seed: ["|||No funding for this category|"] },
          what: "Record needs the agency could not meet. Over a year this becomes exactly the evidence a funder asks for and nobody has." },
        { id: "directory", name: "Referral Directory", needs: "Nothing", on: true,
          render: { fn: "register", key: "ncaf-referral-directory",
                    cols: "Organisation|County|Service type|Contact|Last confirmed",
                    seed: ["||||"] },
          what: "Partner organisations by county and service type, with a flag on anything not confirmed recently." },
        { id: "outcomerate", name: "Referral Outcome Rate", needs: "Their file", render: null,
          what: "Aggregate follow-up: sent, accepted, resolved. The gap CSBG has no requirement for and CARDS cannot track." },
        { id: "coverage", name: "Partner Coverage Map", needs: "Nothing", render: null,
          what: "Which counties have which wraparound services, and where the holes are." },
        { id: "waitlist", name: "Waitlist View", needs: "Their file", render: null,
          what: "Capacity against demand, by programme." }
      ]
    },
    {
      id: "story", n: 6, accent: "#7A4A63", name: "Telling the story",
      blurb: "The same numbers, framed for boards and funders.",
      tools: [
        { id: "plainlang", name: "Plain-Language Checker", needs: "Nothing", render: null, on: true,
          what: "Reading level of anything going to clients. Flags above 8th grade, which is where most agency writing lands." },
        { id: "outcomes", name: "Outcome Dashboard", needs: "Their file", render: null,
          what: "FNPI domains over time, target against actual." },
        { id: "narrative", name: "Impact Narrative Draft", needs: "A server", render: null,
          what: "Aggregate counts turned into publishable prose, with every figure marked for checking." },
        { id: "boardpack", name: "Board Briefing Pack", needs: "A server", render: null,
          what: "One page from the quarter's aggregate figures." },
        { id: "onepager", name: "Funder One-Pager", needs: "A server", render: null,
          what: "The same numbers, framed for one funder's stated priorities." }
      ]
    },
    {
      id: "capability", n: 7, accent: "#3B534A", name: "Building staff capability",
      blurb: "The course, and what people keep after it. Turnover is high — assume whoever opens this is new.",
      tools: [
        { id: "progress", name: "Course Progress", needs: "Nothing", render: { fn: "courseProgress" }, on: true,
          what: "Where you are in the six modules, and where to pick up." },
        { id: "prompt", name: "Prompt Builder", needs: "Nothing", render: "promptbuilder", on: true,
          what: "Assembles your role, the context, the format you need and the guardrails into one complete briefing." },
        { id: "promptlib", name: "Prompt Library", needs: "Nothing", on: true,
          render: { fn: "register", key: "ncaf-prompt-library",
                    cols: "What it is for|The prompt|Who added it|Worked well?",
                    seed: ["||||"] },
          what: "Prompts that worked, saved and shared across the agency instead of rediscovered." },
        { id: "checkthis", name: "Check This", needs: "Nothing", render: null,
          what: "Paste an AI answer and it flags every number, citation and rule that needs a source before you use it." },
        { id: "teamready", name: "Team Readiness", needs: "Nothing", render: null,
          what: "Who is trained, who signs off on AI-assisted work, and what is outstanding." },
        { id: "profile", name: "Readiness Profile", needs: "Nothing", render: null,
          what: "The board-facing one-pager, generated from everything the agency has filled in." }
      ]
    }
  ];

  /* =======================================================================
     HOW A TOOL RENDERS
     ======================================================================= */

  var RENDERERS = {
    courseProgress: function (host) {
      var mods = window.NCAF_MODULES || [];
      var prog = window.NCAF_progress ? window.NCAF_progress() : {};
      var done = mods.filter(function (m) { return prog["m" + m.n] && prog["m" + m.n].complete; });
      var next = mods.filter(function (m) { return !(prog["m" + m.n] && prog["m" + m.n].complete); })[0];
      host.innerHTML =
        '<div class="cp-progress">' +
          '<div class="cp-meter"><i style="width:' + (mods.length ? (done.length / mods.length) * 100 : 0) + '%"></i></div>' +
          "<p><b>" + done.length + " of " + mods.length + "</b> modules complete." +
          (next ? ' Next up: <a href="' + next.file + '">' + next.name + "</a>." : " All six done.") +
          ' <a href="takeaways.html">See the recap</a>.</p>' +
        "</div>";
    },
    register: function (host, cfg) {
      var seed = (cfg.seed || []).map(function (r) {
        return '<span data-row="' + r.replace(/"/g, "&quot;") + '"></span>';
      }).join("");
      host.innerHTML =
        '<div class="exercise" data-interaction="register" data-key="' + cfg.key +
        '" data-cols="' + cfg.cols + '">' + seed + "</div>";
      if (window.NCAF_initInteractions) window.NCAF_initInteractions(host);
    }
  };

  function mount(host, tool) {
    if (typeof tool.render === "string") {
      host.innerHTML = '<div class="exercise" data-interaction="' + tool.render + '"></div>';
      if (window.NCAF_initInteractions) window.NCAF_initInteractions(host);
      return;
    }
    if (tool.render && tool.render.fn && RENDERERS[tool.render.fn]) {
      RENDERERS[tool.render.fn](host, tool.render);
      return;
    }
    host.innerHTML =
      '<div class="tool-stub">' +
        "<p>" + tool.what + "</p>" +
        '<p class="stub-note">Not built yet. Needs: <b>' + tool.needs + "</b>.</p>" +
      "</div>";
  }

  /* =======================================================================
     WINDOW MANAGER
     ======================================================================= */

  var KEY = "ncaf-workspace-v2";
  var GRID = 8;                    // light snap, enough to keep edges tidy
  var MINW = 260, MINH = 150;

  var TOOLS = {};                  // id -> {tool, group}
  WIDGETS.forEach(function (g) {
    g.tools.forEach(function (t) { TOOLS[t.id] = { tool: t, group: g }; });
  });

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var state = load();
  if (!state || !Array.isArray(state.win)) {
    /* First visit opens a small, working set rather than an empty canvas —
       an empty desk tells you nothing about what the desk is for. */
    state = { win: [], z: 10 };
    [["redaction", 24, 24, 420, 400],
     ["progress", 468, 24, 360, 210],
     ["register", 24, 448, 560, 320],
     ["prompt", 468, 258, 360, 510]].forEach(function (d, i) {
      state.win.push({ id: d[0], x: d[1], y: d[2], w: d[3], h: d[4], z: 10 + i, collapsed: false });
    });
    state.z = 20;
    save();
  }

  var canvas, drawer, isTouchLayout = false;

  function snap(n) { return Math.round(n / GRID) * GRID; }
  function findWin(id) {
    for (var i = 0; i < state.win.length; i++) if (state.win[i].id === id) return state.win[i];
    return null;
  }

  /* ---------------- open / close ---------------- */

  function openTool(id) {
    if (findWin(id)) { focusWin(id); return; }
    var entry = TOOLS[id];
    if (!entry) return;
    /* Drop it somewhere visible and slightly offset from the last one. */
    var n = state.win.length;
    var w = { id: id, x: snap(40 + (n % 5) * 28), y: snap(40 + (n % 5) * 28),
              w: 420, h: 380, z: ++state.z, collapsed: false };
    state.win.push(w);
    save();
    renderCanvas();
    focusWin(id);
    var el = canvas.querySelector('[data-win="' + id + '"]');
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function closeTool(id) {
    state.win = state.win.filter(function (w) { return w.id !== id; });
    save();
    renderCanvas();
    renderDrawer();
  }

  function focusWin(id) {
    var w = findWin(id);
    if (!w) return;
    w.z = ++state.z;
    save();
    var el = canvas.querySelector('[data-win="' + id + '"]');
    if (el) el.style.zIndex = w.z;
  }

  /* ---------------- drag + resize ---------------- */

  function wireDrag(el, win) {
    var bar = el.querySelector(".win-bar");
    var grip = el.querySelector(".win-grip");

    function start(e, mode) {
      if (isTouchLayout) return;
      if (e.target.closest("button") && mode === "move") return;
      e.preventDefault();
      focusWin(win.id);
      el.classList.add("is-dragging");

      var sx = e.clientX, sy = e.clientY;
      var ox = win.x, oy = win.y, ow = win.w, oh = win.h;

      function move(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (mode === "move") {
          win.x = Math.max(0, snap(ox + dx));
          win.y = Math.max(0, snap(oy + dy));
          el.style.left = win.x + "px";
          el.style.top = win.y + "px";
        } else {
          win.w = Math.max(MINW, snap(ow + dx));
          win.h = Math.max(MINH, snap(oh + dy));
          el.style.width = win.w + "px";
          el.style.height = win.h + "px";
        }
      }
      function up() {
        el.classList.remove("is-dragging");
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        save();
        growCanvas();
      }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    }

    bar.addEventListener("pointerdown", function (e) { start(e, "move"); });
    if (grip) grip.addEventListener("pointerdown", function (e) { start(e, "resize"); });
    el.addEventListener("pointerdown", function () { focusWin(win.id); });
  }

  function growCanvas() {
    if (isTouchLayout) { canvas.style.height = ""; return; }
    var max = 600;
    state.win.forEach(function (w) {
      max = Math.max(max, w.y + (w.collapsed ? 44 : w.h) + 80);
    });
    canvas.style.height = max + "px";
  }

  /* ---------------- render ---------------- */

  function renderCanvas() {
    canvas.innerHTML = "";

    if (!state.win.length) {
      canvas.innerHTML =
        '<div class="canvas-empty"><p><b>Nothing open.</b></p>' +
        "<p>Pick a tool from the drawer to put it on your workspace.</p></div>";
      canvas.style.height = "";
      return;
    }

    state.win.forEach(function (win) {
      var entry = TOOLS[win.id];
      if (!entry) return;
      var t = entry.tool, g = entry.group;

      var el = document.createElement("section");
      el.className = "win" + (win.collapsed ? " is-collapsed" : "");
      el.setAttribute("data-win", win.id);
      el.style.setProperty("--accent", g.accent);
      if (!isTouchLayout) {
        el.style.left = win.x + "px";
        el.style.top = win.y + "px";
        el.style.width = win.w + "px";
        el.style.height = win.collapsed ? "auto" : win.h + "px";
        el.style.zIndex = win.z;
      }

      el.innerHTML =
        '<header class="win-bar">' +
          '<span class="win-dot"></span>' +
          '<span class="win-title"><b>' + t.name + "</b><span>" + g.name + "</span></span>" +
          '<button class="win-btn" data-act="collapse" type="button" aria-label="Collapse">' +
            (win.collapsed ? "⬜" : "—") + "</button>" +
          '<button class="win-btn" data-act="close" type="button" aria-label="Close">×</button>' +
        "</header>" +
        '<div class="win-body"></div>' +
        '<span class="win-grip" aria-hidden="true"></span>';

      canvas.appendChild(el);

      if (!win.collapsed) mount(el.querySelector(".win-body"), t);

      el.querySelector('[data-act="close"]').addEventListener("click", function (e) {
        e.stopPropagation(); closeTool(win.id);
      });
      el.querySelector('[data-act="collapse"]').addEventListener("click", function (e) {
        e.stopPropagation();
        win.collapsed = !win.collapsed;
        save(); renderCanvas(); growCanvas();
      });

      wireDrag(el, win);
    });

    growCanvas();
  }

  function renderDrawer() {
    drawer.innerHTML = WIDGETS.map(function (g) {
      return '<div class="dw-group" style="--accent:' + g.accent + '">' +
        '<button class="dw-head" type="button" data-g="' + g.id + '">' +
          '<span class="dw-dot"></span><b>' + g.name + "</b>" +
          '<span class="dw-count">' + g.tools.length + "</span>" +
        "</button>" +
        '<div class="dw-list">' + g.tools.map(function (t) {
          var open = !!findWin(t.id);
          return '<button class="dw-tool' + (open ? " is-open" : "") +
            '" type="button" data-t="' + t.id + '" title="' + t.what.replace(/"/g, "") + '">' +
            "<b>" + t.name + "</b>" +
            (t.render ? "" : '<span class="pill soon">Soon</span>') +
            "<span>" + (open ? "On canvas" : "Add") + "</span></button>";
        }).join("") + "</div></div>";
    }).join("");

    Array.prototype.forEach.call(drawer.querySelectorAll(".dw-head"), function (b) {
      b.addEventListener("click", function () {
        b.parentElement.classList.toggle("is-open");
      });
    });
    Array.prototype.forEach.call(drawer.querySelectorAll("[data-t]"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-t");
        if (findWin(id)) { closeTool(id); } else { openTool(id); }
        renderDrawer();
      });
    });
  }

  /* ---------------- presets ---------------- */

  var PRESETS = {
    reporting: ["assembler", "sourcemap", "outputcheck", "redaction"],
    grants:    ["tells", "boilerplate", "pipeline", "prompt"],
    governance:["register", "redaction", "progress", "gaplog"]
  };

  function applyPreset(name) {
    var ids = PRESETS[name] || [];
    state.win = [];
    state.z = 10;
    var x = 24, y = 24;
    ids.forEach(function (id, i) {
      state.win.push({ id: id, x: x, y: y, w: 420, h: 380, z: 10 + i, collapsed: false });
      if (i % 2 === 0) { x += 444; } else { x = 24; y += 404; }
    });
    save(); renderCanvas(); renderDrawer();
  }

  /* ---------------- go ---------------- */

  function init() {
    canvas = document.getElementById("canvas");
    drawer = document.getElementById("drawer");
    if (!canvas || !drawer) return;

    function layout() {
      var touch = window.matchMedia("(max-width: 860px)").matches;
      if (touch !== isTouchLayout) {
        isTouchLayout = touch;
        document.body.classList.toggle("stacked", touch);
        renderCanvas();
      }
    }
    layout();
    window.addEventListener("resize", layout);

    renderCanvas();
    renderDrawer();

    var dt = document.getElementById("drawerToggle");
    if (dt) dt.addEventListener("click", function () {
      document.body.classList.toggle("drawer-open");
      dt.setAttribute("aria-expanded", document.body.classList.contains("drawer-open"));
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) {
      b.addEventListener("click", function () { applyPreset(b.getAttribute("data-preset")); });
    });
    var clr = document.getElementById("clearAll");
    if (clr) clr.addEventListener("click", function () {
      state.win = []; save(); renderCanvas(); renderDrawer();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
