/* ===========================================================================
   The agency workspace.

   Seven widgets an agency already recognises as its own work. Each opens to
   reveal the tools inside it, and each tool is switched on or off per agency.

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
      id: "safety", n: 1, name: "Keeping client data safe",
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
      id: "reporting", n: 2, name: "Getting the report out",
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
      id: "money", n: 3, name: "Finding and winning money",
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
      id: "community", n: 4, name: "Understanding the community",
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
      id: "service", n: 5, name: "Delivering and tracking service",
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
      id: "story", n: 6, name: "Telling the story",
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
      id: "capability", n: 7, name: "Building staff capability",
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

  /* ---------------- state ---------------- */

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  var state = load();
  state.open = state.open || {};
  state.on = state.on || {};

  /* First visit: switch on whatever is marked `on` and already works. */
  if (!state.seeded) {
    WIDGETS.forEach(function (w) {
      w.tools.forEach(function (t) { if (t.on) state.on[t.id] = true; });
    });
    state.open.safety = true;
    state.seeded = true;
    save(state);
  }

  function isOn(t) { return !!state.on[t.id]; }
  function isBuilt(t) { return !!t.render; }

  /* ---------------- custom renderers ---------------- */

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

  /* ---------------- render ---------------- */

  function stateLine(w) {
    var on = w.tools.filter(isOn);
    var ready = on.filter(isBuilt).length;
    if (!on.length) return "Nothing switched on";
    return on.length + (on.length === 1 ? " tool on" : " tools on") +
           (ready < on.length ? " · " + ready + " ready to use" : "");
  }

  function render() {
    var host = document.getElementById("workspace");
    host.innerHTML = WIDGETS.map(function (w) {
      var open = !!state.open[w.id];
      return '<section class="wdg' + (open ? " is-open" : "") + '" id="w-' + w.id + '">' +
        '<button class="wdg-head" type="button" data-w="' + w.id + '" aria-expanded="' + open + '">' +
          '<span class="wdg-n">' + w.n + "</span>" +
          '<span class="wdg-title"><b>' + w.name + "</b><span>" + w.blurb + "</span></span>" +
          '<span class="wdg-state">' + stateLine(w) + "</span>" +
          '<span class="wdg-chev" aria-hidden="true"></span>' +
        "</button>" +
        '<div class="wdg-body">' + w.tools.map(function (t) {
          var on = isOn(t), built = isBuilt(t);
          return '<div class="tl' + (on ? " is-on" : "") + '">' +
            '<div class="tl-head">' +
              '<label class="tl-switch"><input type="checkbox" data-t="' + t.id + '"' + (on ? " checked" : "") + '><span></span></label>' +
              '<div class="tl-name"><b>' + t.name + "</b>" +
                (built ? "" : '<span class="pill soon">Not built</span>') +
                '<span class="tl-needs">' + t.needs + "</span>" +
              "</div>" +
            "</div>" +
            (on ? '<div class="tl-body" data-mount="' + t.id + '"></div>' : "") +
          "</div>";
        }).join("") + "</div>" +
      "</section>";
    }).join("");

    // Mount only what is both switched on and inside an open widget.
    WIDGETS.forEach(function (w) {
      if (!state.open[w.id]) return;
      w.tools.forEach(function (t) {
        if (!isOn(t)) return;
        var slot = host.querySelector('[data-mount="' + t.id + '"]');
        if (slot) mount(slot, t);
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll(".wdg-head"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-w");
        state.open[id] = !state.open[id];
        save(state);
        render();
        var el = document.getElementById("w-" + id);
        if (el && state.open[id]) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("[data-t]"), function (cb) {
      cb.addEventListener("change", function () {
        state.on[cb.getAttribute("data-t")] = cb.checked;
        save(state);
        render();
      });
    });

    var tot = 0, ready = 0;
    WIDGETS.forEach(function (w) {
      w.tools.forEach(function (t) { tot++; if (isBuilt(t)) ready++; });
    });
    var sum = document.getElementById("wsSummary");
    if (sum) {
      var onCount = 0;
      WIDGETS.forEach(function (w) { w.tools.forEach(function (t) { if (isOn(t)) onCount++; }); });
      sum.textContent = onCount + " of " + tot + " tools switched on · " + ready + " built so far";
    }
  }

  function init() {
    if (!document.getElementById("workspace")) return;
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
