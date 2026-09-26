/* ===========================================================================
   SITE CONFIGURATION
   Edit this one file. Every page picks it up. Nothing else needs changing.
   =========================================================================== */

/* ---------------------------------------------------------------------------
   1. PRESENTATION MODE          "demo" | "full"
   ---------------------------------------------------------------------------
   "demo" hides internal and process-facing content: facilitator notes, research
   citation blocks, "not finished yet" hedging, and requests for feedback. The
   learner-facing course, tools and governance material are untouched.

   Nothing is deleted — everything marked [data-editorial] is simply hidden, so
   switching back to "full" restores it. Use "demo" when showing the platform to
   partners; use "full" for the team and for real agency review rounds.        */
window.NCAF_MODE = "demo";

/* ---------------------------------------------------------------------------
   2. REVIEW-DRAFT BANNER        true | false
   ---------------------------------------------------------------------------
   The dark bar at the top of every page. Set false once the course has been
   through faculty and partner review.

   In "demo" mode this shows a shorter, quieter line rather than the full
   warning — a demo audience should know it is a preview without being told
   three times that nothing is final.                                          */
window.NCAF_DRAFT = true;

/* ---------------------------------------------------------------------------
   3. SHARED FEEDBACK COLLECTION
   ---------------------------------------------------------------------------
   Empty: feedback stays in each reviewer's browser and exports as CSV.
   Set to a Google Apps Script web-app URL and every note also lands in one
   shared Sheet. Setup instructions: README -> "Collecting feedback in one place"

   The widget hides itself entirely in "demo" mode unless you force it on with
   NCAF_FEEDBACK_ALWAYS below.                                                  */
window.NCAF_FEEDBACK_ENDPOINT = "";
window.NCAF_FEEDBACK_ALWAYS = false;

/* ---------------------------------------------------------------------------
   4. DEFAULT MODULE VIEW        "learn" | "read"
   ---------------------------------------------------------------------------
   What a first-time visitor gets. "learn" is the stepped card flow; "read" is
   the whole module as one scrollable page. Either way the toggle in the top bar
   lets them switch, and their choice is remembered.                            */
window.NCAF_DEFAULT_VIEW = "learn";

/* ---------------------------------------------------------------------------
   5. TAILORING ENDPOINT
   ---------------------------------------------------------------------------
   Optional. A server-side proxy that composes agency-specific scenarios. Leave
   empty and every module falls back to its authored text, which always works.
   An API key must never be placed in this file — it is public.                 */
window.NCAF_TAILOR_ENDPOINT = "";
