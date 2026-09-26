/* ===========================================================================
   Presentation mode.

   Marks the document with the current mode and hides [data-editorial] content
   when demoing. Hiding rather than deleting means the same build serves both
   audiences and nothing has to be re-added later.

   Runs before anything else so the page never flashes content it is about to
   hide — that flash is the whole reason this is a stylesheet rule set from an
   attribute on <html>, not a pass over the DOM after load.
   =========================================================================== */

(function () {
  "use strict";
  var mode = window.NCAF_MODE === "demo" ? "demo" : "full";
  document.documentElement.setAttribute("data-mode", mode);

  var style = document.createElement("style");
  style.textContent =
    'html[data-mode="demo"] [data-editorial]{display:none !important}';
  (document.head || document.documentElement).appendChild(style);

  window.NCAF_isDemo = function () { return mode === "demo"; };
})();
