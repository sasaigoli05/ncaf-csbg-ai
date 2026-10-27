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
        { id: "assembler", size: [620, 480], name: "Annual Report Assembler", needs: "Their file", render: null, on: true,
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
        { id: "areamap", size: [660, 540], name: "Service Area Map", needs: "Nothing", on: true,
          render: { fn: "countyMap", mode: "service" },
          what: "Click the hundred counties of North Carolina to mark the ones you serve. That set is then shared with every other tool here." },
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
        { id: "coverage", size: [660, 560], name: "Partner Coverage Map", needs: "Nothing", on: true,
          render: { fn: "countyMap", mode: "coverage" },
          what: "Your service area shaded by how many partners the Referral Directory lists in each county. Counties you serve with nobody listed are the holes." },
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
    /* ---------------------------------------------------------------------
       The county map. One hundred North Carolina counties, drawn from the
       Census boundary files and shipped with the page — no map service, no
       key, no request leaving the browser.

       Two modes use it:
         service   click the counties you serve. That set is then available
                   to every other tool.
         coverage  the same counties, shaded by how many partner organisations
                   your Referral Directory lists there. Counties you serve
                   with nobody listed are the holes.
       --------------------------------------------------------------------- */
    countyMap: function (host, cfg) {
      var NC = window.NC_COUNTIES;
      if (!NC) {
        host.innerHTML = '<p class="stub-note">County outlines did not load.</p>';
        return;
      }
      var mode = cfg.mode === "coverage" ? "coverage" : "service";
      var AREA = "ncaf-service-area";
      var DIR = "ncaf-referral-directory";
      /* An example service area, so the map does something on a first look. */
      var EXAMPLE = ["37063", "37135", "37001", "37037", "37145", "37077"];
      var DEMO = { "37063": 4, "37135": 2, "37001": 1, "37037": 0, "37145": 0, "37077": 1 };
      var demo = false;

      var byFips = {}, byName = {};
      NC.counties.forEach(function (c) { byFips[c.f] = c; byName[c.n.toLowerCase()] = c.f; });

      function area() {
        try { var a = JSON.parse(localStorage.getItem(AREA) || "[]"); return Array.isArray(a) ? a : []; }
        catch (e) { return []; }
      }
      function setArea(a) {
        try { localStorage.setItem(AREA, JSON.stringify(a)); } catch (e) {}
        /* Two maps can be open at once; the other one should not go stale. */
        document.dispatchEvent(new CustomEvent("ncaf:area"));
      }
      function partners() {
        if (demo) return DEMO;
        var rows = [];
        try { rows = JSON.parse(localStorage.getItem(DIR) || "[]"); } catch (e) {}
        var out = {};
        (Array.isArray(rows) ? rows : []).forEach(function (r) {
          var n = String((r && r[1]) || "").toLowerCase().replace(/\s*county\s*$/, "").trim();
          var f = byName[n];
          if (f) out[f] = (out[f] || 0) + 1;
        });
        return out;
      }

      host.innerHTML =
        '<div class="ncmap" data-mode="' + mode + '">' +
          '<svg viewBox="' + NC.viewBox + '" class="ncmap-svg" role="img" ' +
            'aria-label="The hundred counties of North Carolina">' +
            NC.counties.map(function (c) {
              return '<path class="cty" data-f="' + c.f + '" d="' + c.d + '">' +
                     "<title>" + c.n + "</title></path>";
            }).join("") +
          "</svg>" +
          '<p class="ncmap-cap" aria-live="polite"></p>' +
          '<div class="ncmap-key"></div>' +
          '<div class="ncmap-act"></div>' +
        "</div>";

      var svg = host.querySelector(".ncmap-svg");
      var cap = host.querySelector(".ncmap-cap");
      var key = host.querySelector(".ncmap-key");
      var act = host.querySelector(".ncmap-act");

      function paint() {
        var served = area(), pc = partners();
        var gaps = [];
        Array.prototype.forEach.call(svg.querySelectorAll(".cty"), function (p) {
          var f = p.getAttribute("data-f");
          var inArea = served.indexOf(f) > -1;
          var n = pc[f] || 0;
          p.setAttribute("class", "cty" +
            (inArea ? " is-served" : "") +
            (mode === "coverage" && inArea
              ? (n === 0 ? " is-gap" : n === 1 ? " is-thin" : " is-covered")
              : ""));
          if (mode === "coverage" && inArea && n === 0) gaps.push(byFips[f].n);
        });

        if (mode === "service") {
          cap.innerHTML = served.length
            ? "<b>" + served.length + "</b> of 100 counties. Click a county to add or remove it."
            : "No counties yet. Click the ones your agency serves.";
          key.innerHTML =
            '<span><i class="sw is-served"></i> You serve this county</span>' +
            '<span><i class="sw"></i> Not in your area</span>';
          act.innerHTML =
            '<button class="mini" data-act="example" type="button">Load an example area</button>' +
            '<button class="mini" data-act="clear" type="button">Clear</button>';
        } else {
          cap.innerHTML = !served.length
            ? "No service area set yet. Open the <b>Service Area Map</b> and click the counties you serve."
            : gaps.length
              ? "<b>" + gaps.length + "</b> of your " + served.length +
                " counties have no partner listed: " + gaps.join(", ") + "."
              : "Every county you serve has at least one partner listed.";
          key.innerHTML =
            '<span><i class="sw is-gap"></i> Nobody listed</span>' +
            '<span><i class="sw is-thin"></i> One partner</span>' +
            '<span><i class="sw is-covered"></i> Two or more</span>';
          act.innerHTML =
            '<button class="mini" data-act="demo" type="button">' +
              (demo ? "Use my directory" : "Show example data") + "</button>";
        }
        wireAct();
      }

      function wireAct() {
        Array.prototype.forEach.call(act.querySelectorAll("[data-act]"), function (b) {
          b.addEventListener("click", function () {
            var a = b.getAttribute("data-act");
            if (a === "example") setArea(EXAMPLE.slice());
            if (a === "clear") setArea([]);
            if (a === "demo") { demo = !demo; if (demo && !area().length) setArea(EXAMPLE.slice()); }
            paint();
          });
        });
      }

      svg.addEventListener("click", function (e) {
        var p = e.target.closest(".cty");
        if (!p) return;
        var f = p.getAttribute("data-f");
        if (mode === "service") {
          var a = area(), i = a.indexOf(f);
          if (i > -1) a.splice(i, 1); else a.push(f);
          setArea(a);
          paint();
        } else {
          var n = (partners()[f] || 0);
          cap.innerHTML = "<b>" + byFips[f].n + "</b> — " +
            (n ? n + " partner" + (n === 1 ? "" : "s") + " listed." : "no partner listed.");
        }
      });
      svg.addEventListener("mouseover", function (e) {
        var p = e.target.closest(".cty");
        if (!p) return;
        var f = p.getAttribute("data-f");
        var n = partners()[f] || 0;
        cap.innerHTML = "<b>" + byFips[f].n + "</b>" +
          (area().indexOf(f) > -1 ? " — in your service area" : "") +
          (mode === "coverage" ? " — " + n + " partner" + (n === 1 ? "" : "s") : "");
      });
      svg.addEventListener("mouseleave", paint);
      document.addEventListener("ncaf:area", function () {
        if (host.isConnected) paint();
      });
      /* The Referral Directory is edited in its own window, so re-read it
         whenever the pointer comes back to this one. */
      host.addEventListener("pointerenter", paint);

      paint();
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
     THE BOARD

     Three kinds of thing live on the board:

       windows   a tool, dragged by its title bar, resized from the corner.
                 Windows never overlap — drop one on another and it slides
                 to the nearest free space.
       headings  a line of text for labelling a section.
       zones     a tinted rectangle you drop windows onto, so a section
                 reads as a section. Zones sit behind everything.
       notes     a small pinned card of text.

     The board is its own scrolling surface and grows as you fill it, so
     you are never arranging tools inside one screenful.
     ======================================================================= */

  var KEY = "ncaf-board-v1";
  var GRID = 8;                    // light snap, enough to keep edges tidy
  var GAP = 12;                    // breathing room enforced between windows
  var PAD = 24;                    // margin around the surface contents
  var BAR = 44;                    // height of a collapsed window
  var MINW = 260, MINH = 150;
  var BASE_W = 1480, BASE_H = 940; // the board is this big before you add to it

  var TONES = ["#2E5D4E", "#B0740F", "#A2412A", "#3E6B8A", "#5B4B8A", "#3B534A"];

  var TOOLS = {};                  // id -> {tool, group}
  WIDGETS.forEach(function (g) {
    g.tools.forEach(function (t) { TOOLS[t.id] = { tool: t, group: g }; });
  });

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var state = load();
  if (!state || !Array.isArray(state.win)) state = starter();

  /* A first visit opens a laid-out board rather than an empty one. An empty
     desk tells you nothing about what the desk is for. */
  function starter() {
    var s = { win: [], notes: [], room: { w: BASE_W, h: BASE_H }, z: 10 };
    s.notes = [
      { id: "z1", kind: "zone", text: "Before anything goes into a tool", tone: 2, x: 24, y: 64, w: 500, h: 804 },
      { id: "h1", kind: "heading", text: "Keeping client data safe", tone: 2, x: 24, y: 20, w: 460, h: 38 },
      { id: "z2", kind: "zone", text: "Day to day", tone: 0, x: 556, y: 64, w: 884, h: 804 },
      { id: "h2", kind: "heading", text: "Your work this week", tone: 0, x: 556, y: 20, w: 460, h: 38 },
      { id: "n1", kind: "note", text: "Anything you fill in here stays in this browser. Nothing is sent anywhere.",
        tone: 1, x: 1176, y: 96, w: 240, h: 150 }
    ];
    [["redaction", 48, 104, 452, 420],
     ["register", 48, 540, 452, 304],
     ["progress", 580, 104, 568, 220],
     ["prompt", 580, 348, 568, 496],
     ["promptlib", 1176, 268, 240, 60]].forEach(function (d, i) {
      s.win.push({ id: d[0], x: d[1], y: d[2], w: d[3], h: d[4], z: 10 + i, collapsed: d[0] === "promptlib" });
    });
    s.z = 20;
    return s;
  }
  if (!Array.isArray(state.notes)) state.notes = [];
  if (!state.room) state.room = { w: BASE_W, h: BASE_H };

  var canvas, surface, drawer, isTouchLayout = false;

  function snap(n) { return Math.round(n / GRID) * GRID; }
  function findWin(id) {
    for (var i = 0; i < state.win.length; i++) if (state.win[i].id === id) return state.win[i];
    return null;
  }
  function findNote(id) {
    for (var i = 0; i < state.notes.length; i++) if (state.notes[i].id === id) return state.notes[i];
    return null;
  }
  function winH(w) { return w.collapsed ? BAR : w.h; }

  /* ---------------- keeping windows off each other ---------------- */

  function hits(a, b) {
    return a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP &&
           a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP;
  }
  function clashes(r, exceptId) {
    for (var i = 0; i < state.win.length; i++) {
      var o = state.win[i];
      if (o.id === exceptId) continue;
      if (hits(r, { x: o.x, y: o.y, w: o.w, h: winH(o) })) return true;
    }
    return false;
  }

  /* The nearest free space to `prefer`, or the first free space in reading
     order when nothing is preferred. Falls back to a new row at the bottom. */
  function findSpot(w, h, prefer, exceptId, minY) {
    var step = 16;
    var top = minY || PAD;
    var maxX = Math.max(boardW() - w - PAD, PAD);
    var maxY = Math.max(boardH() - h - PAD, top);
    var best = null, bestD = Infinity;
    for (var y = top; y <= maxY; y += step) {
      for (var x = PAD; x <= maxX; x += step) {
        if (clashes({ x: x, y: y, w: w, h: h }, exceptId)) continue;
        if (!prefer) return { x: snap(x), y: snap(y) };
        var dx = x - prefer.x, dy = y - prefer.y, d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = { x: snap(x), y: snap(y) }; }
      }
    }
    if (best) return best;
    var bottom = top;
    state.win.forEach(function (o) {
      if (o.id !== exceptId) bottom = Math.max(bottom, o.y + winH(o) + GAP);
    });
    return { x: PAD, y: snap(bottom) };
  }

  /* ---------------- how big the board is ---------------- */

  function contentW() {
    var m = 0;
    state.win.forEach(function (w) { m = Math.max(m, w.x + w.w); });
    state.notes.forEach(function (n) { m = Math.max(m, n.x + n.w); });
    return m + PAD * 2;
  }
  function contentH() {
    var m = 0;
    state.win.forEach(function (w) { m = Math.max(m, w.y + winH(w)); });
    state.notes.forEach(function (n) { m = Math.max(m, n.y + n.h); });
    return m + PAD * 2;
  }
  function boardW() { return Math.max(state.room.w, contentW()); }
  function boardH() { return Math.max(state.room.h, contentH()); }

  function sizeBoard() {
    if (isTouchLayout) { surface.style.width = ""; surface.style.height = ""; return; }
    surface.style.width = boardW() + "px";
    surface.style.height = boardH() + "px";
    var sz = document.getElementById("boardSize");
    if (sz) sz.textContent = Math.round(boardW() / 100) * 100 + " × " + Math.round(boardH() / 100) * 100;
  }

  function addRoom(dw, dh) {
    state.room.w = Math.max(BASE_W, boardW() + dw);
    state.room.h = Math.max(BASE_H, boardH() + dh);
    save(); sizeBoard();
    if (dw) canvas.scrollTo({ left: canvas.scrollWidth, behavior: "smooth" });
    else canvas.scrollTo({ top: canvas.scrollHeight, behavior: "smooth" });
  }

  /* ---------------- open / close ---------------- */

  function openTool(id) {
    if (findWin(id)) { focusWin(id); return; }
    var entry = TOOLS[id];
    if (!entry) return;
    var size = entry.tool.size || [452, 380];
    var w = size[0], h = size[1];
    var at = findSpot(w, h, null, null);
    var win = { id: id, x: at.x, y: at.y, w: w, h: h, z: ++state.z, collapsed: false };
    state.win.push(win);
    save();
    renderCanvas();
    focusWin(id);
    var el = surface.querySelector('[data-win="' + id + '"]');
    if (el) el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
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
    var el = surface.querySelector('[data-win="' + id + '"]');
    if (el) el.style.zIndex = w.z;
  }

  /* ---------------- drag + resize ---------------- */

  /* One mover for every kind of thing on the board. `resolve` is what makes
     windows refuse to sit on top of each other; headings and notes are
     placed by hand and left where they are put. */
  function wireMove(el, item, opts) {
    opts = opts || {};
    var handle = opts.handle || el;

    function start(e, mode) {
      if (isTouchLayout) return;
      if (e.target.closest("button, [contenteditable], input, select, textarea") && mode === "move") return;
      e.preventDefault();
      if (opts.focus) focusWin(item.id);
      el.classList.add("is-dragging");

      var sx = e.clientX, sy = e.clientY;
      var ox = item.x, oy = item.y, ow = item.w, oh = item.h;
      /* Worked out once, from the footprint the window starts with, so the
         limit does not shift under the cursor while you are dragging. */
      var lim = (opts.resolve && mode === "resize") ? room(item) : null;

      function move(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (mode === "move") {
          item.x = Math.max(PAD, snap(ox + dx));
          item.y = Math.max(PAD, snap(oy + dy));
          el.style.left = item.x + "px";
          el.style.top = item.y + "px";
          if (opts.resolve) {
            el.classList.toggle("is-blocked",
              clashes({ x: item.x, y: item.y, w: item.w, h: winH(item) }, item.id));
          }
        } else {
          item.w = Math.max(opts.minW || MINW, snap(ow + dx));
          item.h = Math.max(opts.minH || MINH, snap(oh + dy));
          if (lim) {
            /* Stop a window growing into its neighbour rather than letting it
               overlap and then jumping it somewhere else. */
            item.w = Math.min(item.w, lim.w);
            item.h = Math.min(item.h, lim.h);
          }
          el.style.width = item.w + "px";
          el.style.height = item.h + "px";
        }
      }
      function up() {
        el.classList.remove("is-dragging", "is-blocked");
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        if (opts.resolve && mode === "resize") {
          /* A corner drag can only reach a diagonal neighbour by growing both
             ways at once; give back the last few pixels if it did. */
          var guard = 0;
          while (guard++ < 120 &&
                 clashes({ x: item.x, y: item.y, w: item.w, h: winH(item) }, item.id)) {
            if (item.h > (opts.minH || MINH)) item.h -= GRID;
            else if (item.w > (opts.minW || MINW)) item.w -= GRID;
            else break;
          }
          el.style.width = item.w + "px";
          el.style.height = item.h + "px";
        }
        if (opts.resolve && mode === "move" &&
            clashes({ x: item.x, y: item.y, w: item.w, h: winH(item) }, item.id)) {
          var at = findSpot(item.w, winH(item), { x: item.x, y: item.y }, item.id);
          item.x = at.x; item.y = at.y;
          el.classList.add("is-settling");
          el.style.left = item.x + "px";
          el.style.top = item.y + "px";
          setTimeout(function () { el.classList.remove("is-settling"); }, 220);
        }
        save();
        sizeBoard();
      }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    }

    handle.addEventListener("pointerdown", function (e) { start(e, "move"); });
    var grip = el.querySelector(".win-grip");
    if (grip && opts.resizable !== false) {
      grip.addEventListener("pointerdown", function (e) { start(e, "resize"); });
    }
  }

  /* How far this window may grow before it meets the next one. */
  function room(win) {
    var mw = Infinity, mh = Infinity;
    state.win.forEach(function (o) {
      if (o.id === win.id) return;
      var oh = winH(o);
      if (o.x + o.w > win.x && win.y < o.y + oh + GAP && o.y < win.y + win.h + GAP) {
        if (o.x >= win.x) mw = Math.min(mw, o.x - GAP - win.x);
      }
      if (o.y + oh > win.y && win.x < o.x + o.w + GAP && o.x < win.x + win.w + GAP) {
        if (o.y >= win.y) mh = Math.min(mh, o.y - GAP - win.y);
      }
    });
    return { w: Math.max(MINW, mw), h: Math.max(MINH, mh) };
  }

  /* ---------------- headings, zones, notes ---------------- */

  var DEF = {
    heading: { w: 460, h: 38, text: "Section name" },
    zone:    { w: 620, h: 460, text: "Section" },
    note:    { w: 240, h: 150, text: "A note to whoever opens this next." }
  };

  function addNote(kind) {
    var d = DEF[kind];
    var n = { id: "n" + Date.now().toString(36), kind: kind, text: d.text,
              tone: state.notes.length % TONES.length,
              x: PAD, y: PAD, w: d.w, h: d.h };
    /* Drop it where you are looking, not at the origin. */
    n.x = snap(Math.max(PAD, canvas.scrollLeft + 40));
    n.y = snap(Math.max(PAD, canvas.scrollTop + 40));
    state.notes.push(n);
    save();
    renderCanvas();
    var el = surface.querySelector('[data-note="' + n.id + '"] .note-text');
    if (el) { el.focus(); document.execCommand && document.execCommand("selectAll", false, null); }
  }

  function removeNote(id) {
    state.notes = state.notes.filter(function (n) { return n.id !== id; });
    save(); renderCanvas();
  }

  function noteEl(n) {
    var el = document.createElement("div");
    el.className = "bnote is-" + n.kind;
    el.setAttribute("data-note", n.id);
    el.style.setProperty("--accent", TONES[n.tone % TONES.length]);
    el.style.left = n.x + "px";
    el.style.top = n.y + "px";
    el.style.width = n.w + "px";
    if (n.kind !== "heading") el.style.height = n.h + "px";

    el.innerHTML =
      '<span class="note-grip-move" aria-hidden="true">⠿</span>' +
      '<div class="note-text" contenteditable="true" spellcheck="false" role="textbox" ' +
        'aria-label="' + n.kind + ' text">' + esc(n.text) + "</div>" +
      '<span class="note-tools">' +
        '<button class="note-btn note-tone" type="button" aria-label="Change colour"></button>' +
        '<button class="note-btn" data-act="del" type="button" aria-label="Remove">×</button>' +
      "</span>" +
      (n.kind === "heading" ? "" : '<span class="win-grip" aria-hidden="true"></span>');

    var txt = el.querySelector(".note-text");
    txt.addEventListener("blur", function () {
      n.text = txt.textContent.trim();
      save();
    });
    txt.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && n.kind !== "note") { e.preventDefault(); txt.blur(); }
      if (e.key === "Escape") txt.blur();
    });
    el.querySelector('[data-act="del"]').addEventListener("click", function () { removeNote(n.id); });
    el.querySelector(".note-tone").addEventListener("click", function () {
      n.tone = (n.tone + 1) % TONES.length;
      save();
      el.style.setProperty("--accent", TONES[n.tone % TONES.length]);
    });

    wireMove(el, n, {
      handle: el.querySelector(".note-grip-move"),
      resizable: n.kind !== "heading",
      minW: n.kind === "note" ? 180 : 240,
      minH: n.kind === "note" ? 90 : 140
    });
    return el;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------------- render ---------------- */

  function winEl(win) {
    var entry = TOOLS[win.id];
    if (!entry) return null;
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
        '<button class="win-btn" data-act="collapse" type="button" aria-label="' +
          (win.collapsed ? "Expand" : "Collapse") + '">' + (win.collapsed ? "+" : "–") + "</button>" +
        '<button class="win-btn" data-act="close" type="button" aria-label="Close">×</button>' +
      "</header>" +
      '<div class="win-body"></div>' +
      '<span class="win-grip" aria-hidden="true"></span>';

    if (!win.collapsed) mount(el.querySelector(".win-body"), t);

    el.querySelector('[data-act="close"]').addEventListener("click", function (e) {
      e.stopPropagation(); closeTool(win.id);
    });
    el.querySelector('[data-act="collapse"]').addEventListener("click", function (e) {
      e.stopPropagation();
      win.collapsed = !win.collapsed;
      save(); renderCanvas();
    });
    el.addEventListener("pointerdown", function () { focusWin(win.id); });

    wireMove(el, win, { handle: el.querySelector(".win-bar"), resolve: true, focus: true });
    return el;
  }

  function renderCanvas() {
    surface.innerHTML = "";

    if (!state.win.length && !state.notes.length) {
      surface.innerHTML =
        '<div class="canvas-empty"><p><b>An empty board.</b></p>' +
        "<p>Add a tool from the drawer, or lay out your sections first with a heading.</p></div>";
      sizeBoard();
      return;
    }

    if (isTouchLayout) {
      /* No dragging on a phone. The board becomes a document, read in the
         order you arranged it — headings still do their job. */
      var zones = state.notes.filter(function (n) { return n.kind === "zone"; })
        .sort(function (a, b) { return (a.y - b.y) || (a.x - b.x); });

      /* Side-by-side sections would interleave if we sorted on y alone, so
         each thing is first filed under the section it was dropped into. */
      function zoneOf(it, w, h) {
        var cx = it.x + w / 2, cy = it.y + h / 2;
        for (var i = 0; i < zones.length; i++) {
          var z = zones[i];
          if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) return { i: i, rank: 1 };
        }
        if (it.kind === "heading") {
          for (var j = 0; j < zones.length; j++) {
            var zz = zones[j];
            var over = it.x < zz.x + zz.w && zz.x < it.x + w;
            var above = zz.y - (it.y + h) >= -10 && zz.y - (it.y + h) <= 120;
            if (over && above) return { i: j, rank: 0 };
          }
        }
        return { i: zones.length, rank: 1 };
      }

      var all = [];
      state.notes.forEach(function (n) {
        if (n.kind === "zone") return;
        var z = zoneOf(n, n.w, n.h);
        all.push({ z: z.i, r: z.rank, y: n.y, x: n.x, note: n });
      });
      state.win.forEach(function (w) {
        var z = zoneOf(w, w.w, winH(w));
        all.push({ z: z.i, r: z.rank, y: w.y, x: w.x, win: w });
      });
      all.sort(function (a, b) {
        return (a.z - b.z) || (a.r - b.r) || (a.y - b.y) || (a.x - b.x);
      });
      all.forEach(function (it) {
        var el = it.win ? winEl(it.win) : noteEl(it.note);
        if (el) surface.appendChild(el);
      });
      sizeBoard();
      return;
    }

    /* Zones behind, then headings and notes, then the windows on top. */
    state.notes.filter(function (n) { return n.kind === "zone"; })
      .forEach(function (n) { surface.appendChild(noteEl(n)); });
    state.notes.filter(function (n) { return n.kind !== "zone"; })
      .forEach(function (n) { surface.appendChild(noteEl(n)); });
    state.win.forEach(function (w) {
      var el = winEl(w);
      if (el) surface.appendChild(el);
    });

    sizeBoard();
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
            "<span>" + (open ? "On board" : "Add") + "</span></button>";
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
    reporting: {
      title: "Reporting season",
      tools: ["assembler", "sourcemap", "outputcheck", "redaction"]
    },
    grants: {
      title: "Grant deadline",
      tools: ["tells", "boilerplate", "pipeline", "prompt"]
    },
    governance: {
      title: "Governance",
      tools: ["register", "redaction", "progress", "gaplog"]
    },
    area: {
      title: "Service area",
      tools: ["areamap", "coverage", "directory", "gaplog"]
    }
  };

  function applyPreset(name) {
    var p = PRESETS[name];
    if (!p) return;
    state.win = [];
    state.notes = [{ id: "n" + Date.now().toString(36), kind: "heading", text: p.title,
                     tone: 0, x: PAD, y: 20, w: 460, h: 38 }];
    state.z = 10;
    state.room = { w: BASE_W, h: BASE_H };
    p.tools.forEach(function (id, i) {
      var entry = TOOLS[id];
      if (!entry) return;
      var size = entry.tool.size || [452, 400];
      var at = findSpot(size[0], size[1], null, null, 80);
      state.win.push({ id: id, x: at.x, y: at.y, w: size[0], h: size[1],
                       z: 10 + i, collapsed: false });
    });
    save(); renderCanvas(); renderDrawer();
    canvas.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  /* ---------------- go ---------------- */

  function measureChrome() {
    var head = document.querySelector(".sticky-head");
    var bar = document.querySelector(".ws-bar");
    var h = (head ? head.offsetHeight : 0) + (bar ? bar.offsetHeight : 0);
    document.documentElement.style.setProperty("--ws-chrome", h + "px");
  }

  function init() {
    canvas = document.getElementById("canvas");
    surface = document.getElementById("surface");
    drawer = document.getElementById("drawer");
    if (!canvas || !surface || !drawer) return;

    function layout() {
      measureChrome();
      var touch = window.matchMedia("(max-width: 860px)").matches;
      if (touch !== isTouchLayout) {
        isTouchLayout = touch;
        document.body.classList.toggle("stacked", touch);
        renderCanvas();
      } else {
        sizeBoard();
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

    Array.prototype.forEach.call(document.querySelectorAll("[data-add]"), function (b) {
      b.addEventListener("click", function () { addNote(b.getAttribute("data-add")); });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) {
      b.addEventListener("click", function () { applyPreset(b.getAttribute("data-preset")); });
    });
    var wider = document.getElementById("roomWider");
    if (wider) wider.addEventListener("click", function () { addRoom(520, 0); });
    var taller = document.getElementById("roomTaller");
    if (taller) taller.addEventListener("click", function () { addRoom(0, 420); });

    var clr = document.getElementById("clearAll");
    if (clr) clr.addEventListener("click", function () {
      state.win = []; state.notes = []; state.room = { w: BASE_W, h: BASE_H };
      save(); renderCanvas(); renderDrawer();
    });
    var reset = document.getElementById("resetBoard");
    if (reset) reset.addEventListener("click", function () {
      state = starter(); save(); renderCanvas(); renderDrawer();
      canvas.scrollTo({ top: 0, left: 0 });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
