/* ===========================================================================
   NCAF AI Literacy Course — shared profile + tailoring engine
   Loaded by every page. setup.html writes the profile; modules read it.

   DESIGN RULES (these are load-bearing, not style preferences)

   1. AGENCY-LEVEL ONLY. The profile describes an organization, never a person
      served by it. No client fields exist in the schema, and the intake UI says
      so out loud. This is the course practicing what Module 3 teaches.

   2. ON-DEVICE. The profile lives in localStorage. It is never transmitted
      except, optionally, the one open-text sentence the learner chooses to send
      to the parse endpoint. Storage can fail (private window, blocked cookies),
      so every read is wrapped and every module must render sensibly with an
      empty profile.

   3. DEGRADE, DON'T BREAK. Tailoring has four tiers. Tier 0 (generic copy)
      always works with zero dependencies. Each higher tier adds specificity if
      it is available. A module with no profile and no network is still a
      complete module.

   4. CACHE GENERATED TEXT. An LLM-composed scenario is written to the profile
      the first time and reused forever after. A learner who reloads must see
      the same scenario they were halfway through — and we don't pay twice.
   =========================================================================== */

(function (global) {
  "use strict";

  var STORE = "ncaf-ai-profile";
  var SCHEMA_VERSION = 1;

  /* ---------------------------------------------------------------------
     PROFILE SCHEMA
     Every field is optional. Modules must handle absence of any of them.
     --------------------------------------------------------------------- */

  var EMPTY_PROFILE = {
    v: SCHEMA_VERSION,
    createdAt: null,

    org: {
      name: "",              // "Mountain Projects, Inc."
      counties: [],          // ["Haywood", "Jackson"]
      staffBand: "",         // "1-5" | "6-15" | "16-50" | "50+"
      model: "",             // "direct" | "referral" | "mixed"
      programs: []           // ["CSBG","HeadStart","WIOA","LIHEAP/WAP","HUD","Food","Transit"]
    },

    systems: {
      caseManagement: "",    // "CARDS" | "Cap60" | "other" | "none" | "unsure"
      reportsFiled: [],      // ["1B","2A","2C","3","4A","4B","4C"]
      aiAccount: ""          // "none" | "personal-unpaid" | "paid-individual" | "org-account" | "unsure"
    },

    people: {
      learnerRole: "",       // "Executive Director" | "CSBG Director" | "Fiscal" | "Grants" | "Program" | "Board"
      hasGrantWriter: null,  // true | false | null
      hasDataStaff: null,
      hasIT: null,
      askFirst: "",          // open text — the person to ask. Module 1 Part 5 writes this.
      accountable: ""        // guardrail 2: the named person who signs off on AI-assisted output
    },

    work: {
      processes: [],         // open text list — "what are you working on"
      painPoint: ""          // open text — the single thing that eats the most time
    },

    funders: [],             // ["Dogwood Health Trust","United Way","HUD"]

    // Cached LLM output, keyed by slot id. Written once, reused forever.
    generated: {}
  };

  /* ---------------------------------------------------------------------
     STORAGE
     --------------------------------------------------------------------- */

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    var raw;
    try { raw = localStorage.getItem(STORE); } catch (e) { return clone(EMPTY_PROFILE); }
    if (!raw) return clone(EMPTY_PROFILE);
    try {
      var p = JSON.parse(raw);
      if (!p || p.v !== SCHEMA_VERSION) return clone(EMPTY_PROFILE); // TODO: migrate, don't discard
      return Object.assign(clone(EMPTY_PROFILE), p);
    } catch (e) {
      return clone(EMPTY_PROFILE);
    }
  }

  function save(p) {
    try { localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) { /* non-fatal */ }
    return p;
  }

  var profile = load();

  function isSetUp() { return !!(profile.org.name || profile.org.programs.length); }

  /* ---------------------------------------------------------------------
     TIER 1 — SLOTS
     Deterministic substitution. No network, no cost, no hallucination.

       <span data-slot="org.name">your agency</span>

     The element's existing text is the fallback and stays if the slot is
     empty — so an un-set-up course still reads as correct English.
     --------------------------------------------------------------------- */

  function dig(path) {
    return path.split(".").reduce(function (o, k) {
      return (o === null || o === undefined) ? undefined : o[k];
    }, profile);
  }

  // Derived slots — computed, not stored. Add here rather than denormalizing.
  var DERIVED = {
    "derived.countyPhrase": function () {
      var c = profile.org.counties;
      if (!c.length) return "";
      if (c.length === 1) return c[0] + " County";
      if (c.length === 2) return c[0] + " and " + c[1] + " Counties";
      return c.slice(0, -1).join(", ") + " and " + c[c.length - 1] + " Counties";
    },
    "derived.systemName": function () {
      var s = profile.systems.caseManagement;
      if (!s || s === "unsure" || s === "none") return "";
      return s === "other" ? "your case-management system" : s;
    },
    "derived.serviceVerb": function () {
      return profile.org.model === "referral" ? "refer" : "serve";
    },
    "derived.topFunder": function () {
      return profile.funders[0] || "";
    },
    "derived.signer": function () {
      return profile.people.accountable || profile.people.askFirst || "";
    }
  };

  function slotValue(path) {
    if (DERIVED[path]) return DERIVED[path]();
    var v = dig(path);
    if (Array.isArray(v)) return v.join(", ");
    return (v === null || v === undefined) ? "" : String(v);
  }

  function applySlots(root) {
    var nodes = (root || document).querySelectorAll("[data-slot]");
    Array.prototype.forEach.call(nodes, function (el) {
      var v = slotValue(el.getAttribute("data-slot"));
      if (v) {
        el.textContent = v;
        el.classList.add("is-tailored");
      }
      // else: leave the authored fallback text in place
    });
  }

  /* ---------------------------------------------------------------------
     TIER 2 — CONDITIONS
     Show or hide a block based on the profile.

       <div data-if="program:HeadStart">…</div>
       <div data-if="model:referral">…</div>
       <div data-if="!system:CARDS">…</div>
       <div data-if="report:4A">…</div>
       <div data-if="ai:personal-unpaid">…</div>

     Unknown or unevaluable tests resolve TRUE, so content is never silently
     lost because a profile field is missing. Hiding is opt-in, not default.
     --------------------------------------------------------------------- */

  var TESTS = {
    program: function (v) { return profile.org.programs.indexOf(v) !== -1; },
    model:   function (v) { return profile.org.model === v; },
    system:  function (v) { return profile.systems.caseManagement === v; },
    report:  function (v) { return profile.systems.reportsFiled.indexOf(v) !== -1; },
    ai:      function (v) { return profile.systems.aiAccount === v; },
    staff:   function (v) { return profile.org.staffBand === v; },
    role:    function (v) { return profile.people.learnerRole === v; },
    has:     function (v) { return profile.people["has" + v] === true; },
    signer:  function (v) { return v === "yes" ? !!profile.people.accountable : !profile.people.accountable; },
    setup:   function () { return isSetUp(); }
  };

  function evalCondition(expr) {
    var negate = expr.charAt(0) === "!";
    if (negate) expr = expr.slice(1);
    var parts = expr.split(":");
    var fn = TESTS[parts[0]];
    if (!fn) return true;                 // unknown test — show it
    if (!isSetUp()) return !negate;       // no profile — show the positive branch
    var result = !!fn(parts[1]);
    return negate ? !result : result;
  }

  function applyConditions(root) {
    var nodes = (root || document).querySelectorAll("[data-if]");
    Array.prototype.forEach.call(nodes, function (el) {
      el.hidden = !evalCondition(el.getAttribute("data-if"));
    });
  }

  /* ---------------------------------------------------------------------
     TIER 3 — VARIANTS
     Pick one of N pre-written scenario sets. Authored, reviewed, safe —
     this is where most real tailoring should live. An LLM is not required
     to know that a referral-only agency needs different examples.

       Tailor.variant("m1.sortTasks")  ->  the right array for this profile

     Register variant sets from the module file (see module-1 scaffold).
     --------------------------------------------------------------------- */

  var variants = {};   // id -> { pick(profile) -> value, default: value }

  function registerVariant(id, spec) { variants[id] = spec; }

  function variant(id) {
    var spec = variants[id];
    if (!spec) return null;
    if (!isSetUp() || typeof spec.pick !== "function") return spec.default;
    var v = spec.pick(profile);
    return (v === undefined || v === null) ? spec.default : v;
  }

  /* ---------------------------------------------------------------------
     TIER 4 — GENERATED
     One LLM call composes a scenario in the agency's own terms. Cached to
     the profile on first success and never re-requested.

     DEPLOYMENT NOTE — the API key can never sit in this file. Three options,
     in the order we should prefer them:
       a) Course hosted with a small backend that proxies this call, holds the
          key server-side, rate-limits, and refuses any payload containing
          anything but the profile. (Scoping item D-7.)
       b) Agency supplies its own key, entered once and kept in localStorage.
          Shifts cost and consent to the agency; needs a clear warning.
       c) No endpoint. Everything falls back to Tier 3. This must always work.
     --------------------------------------------------------------------- */

  var ENDPOINT = window.NCAF_TAILOR_ENDPOINT || null;   // set in config.js

  function generated(id) {
    return profile.generated[id] || null;
  }

  function generate(id, instruction) {
    var cached = profile.generated[id];
    if (cached) return Promise.resolve(cached);
    if (!ENDPOINT || !isSetUp()) return Promise.resolve(null);

    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot: id,
        instruction: instruction,
        // Only the organizational profile is sent. Never anything else.
        profile: {
          org: profile.org,
          systems: profile.systems,
          work: profile.work,
          funders: profile.funders
        }
      })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.text) return null;
        profile.generated[id] = data.text;
        save(profile);
        return data.text;
      })
      .catch(function () { return null; });   // silent — Tier 3 already rendered
  }

  /* ---------------------------------------------------------------------
     APPLY — run all deterministic tiers. Safe to call repeatedly.
     --------------------------------------------------------------------- */

  function apply(root) {
    applyConditions(root);
    applySlots(root);
    document.documentElement.classList.toggle("has-profile", isSetUp());
  }

  /* ---------------------------------------------------------------------
     PUBLIC API
     --------------------------------------------------------------------- */

  global.Tailor = {
    profile: profile,
    isSetUp: isSetUp,
    get: slotValue,
    set: function (patch) {
      deepMerge(profile, patch);
      if (!profile.createdAt) profile.createdAt = new Date().toISOString();
      save(profile);
      return profile;
    },
    reset: function () {
      profile = clone(EMPTY_PROFILE);
      save(profile);
      return profile;
    },
    apply: apply,
    registerVariant: registerVariant,
    variant: variant,
    generate: generate,
    generated: generated,
    setEndpoint: function (url) { ENDPOINT = url; },
    EMPTY: EMPTY_PROFILE
  };

  function deepMerge(target, patch) {
    Object.keys(patch).forEach(function (k) {
      var v = patch[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        target[k] = target[k] || {};
        deepMerge(target[k], v);
      } else {
        target[k] = v;
      }
    });
    return target;
  }

})(window);
