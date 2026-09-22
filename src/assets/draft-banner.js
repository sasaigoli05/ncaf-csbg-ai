/* ===========================================================================
   Review-draft notice. Shown on every page while window.NCAF_DRAFT is true.

   TO REMOVE WHEN THE COURSE IS FINAL: set NCAF_DRAFT = false in
   assets/config.js. One line, one file. No need to touch any page.
   =========================================================================== */

(function () {
  "use strict";
  if (!window.NCAF_DRAFT) return;

  function mount() {
    if (document.getElementById("ncaf-draft")) return;

    var style = document.createElement("style");
    style.textContent = [
      '#ncaf-draft{background:#14302A;color:#F6E9CB;font-family:"Public Sans",system-ui,-apple-system,sans-serif;font-size:.82rem;line-height:1.45;padding:.5rem 1.25rem;text-align:center}',
      '#ncaf-draft b{color:#fff;font-weight:600}',
      '#ncaf-draft span{color:#C3D3CA}'
    ].join("");
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.id = "ncaf-draft";
    bar.setAttribute("role", "note");
    bar.innerHTML =
      "<b>Review draft.</b> " +
      "<span>This course is still being written and reviewed. " +
      "Content will change, and nothing here should be treated as final guidance yet.</span>";

    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
