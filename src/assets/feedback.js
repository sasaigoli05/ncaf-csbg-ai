/* ===========================================================================
   NCAF AI Task Force — team feedback widget
   Drop-in: <script src="assets/feedback.js" defer></script>
   Self-contained. Injects its own styles so it can be added to any page
   without touching that page's CSS.

   HOW IT STORES FEEDBACK
   Every note is written to localStorage first, always, with no network call.
   That means it works on a plane, on a locked-down agency laptop, and before
   anyone has set up a backend. Notes accumulate per-reviewer and export as a
   properly-escaped CSV.

   OPTIONAL SHARED COLLECTION
   If window.NCAF_FEEDBACK_ENDPOINT is set (see assets/config.js), each note is
   ALSO POSTed there. Point it at a Google Apps Script web app bound to a Sheet
   and every reviewer's notes land in one place automatically. The POST is
   best-effort: if it fails the note is still saved locally and marked unsent,
   and the reviewer can still export the CSV.
   =========================================================================== */

(function () {
  "use strict";

  var STORE = "ncaf-feedback-v1";
  var WHO = "ncaf-feedback-who";
  var ENDPOINT = window.NCAF_FEEDBACK_ENDPOINT || "";

  var CATEGORIES = [
    "Content — wrong or missing",
    "Clarity — hard to follow",
    "Accuracy — check this claim",
    "Tone — wrong for the audience",
    "Design or layout",
    "Bug — something broke",
    "Idea / suggestion"
  ];

  /* ---------- storage ---------- */

  function read() {
    try { return JSON.parse(localStorage.getItem(STORE) || "[]") || []; }
    catch (e) { return []; }
  }
  function write(rows) {
    try { localStorage.setItem(STORE, JSON.stringify(rows)); } catch (e) {}
  }
  function getWho() {
    try { return localStorage.getItem(WHO) || ""; } catch (e) { return ""; }
  }
  function setWho(v) {
    try { localStorage.setItem(WHO, v); } catch (e) {}
  }

  /* ---------- page + section detection ---------- */

  function pageSlug() {
    var f = location.pathname.split("/").pop() || "index.html";
    return f.replace(/\.html?$/, "") || "index";
  }

  function headings() {
    var hs = [];
    Array.prototype.forEach.call(
      document.querySelectorAll("main h2, main h3, section h2, section h3, .hero h1, h1"),
      function (h) {
        var t = (h.textContent || "").trim().replace(/\s+/g, " ");
        if (t && t.length < 120 && !h.closest("#ncaf-fb")) {
          hs.push({ el: h, text: t });
        }
      }
    );
    return hs;
  }

  /* The heading whose top is nearest above the middle of the viewport —
     i.e. what the reviewer is actually looking at when they click. */
  function currentSection(list) {
    var mid = window.scrollY + window.innerHeight * 0.4;
    var best = list.length ? list[0].text : "";
    for (var i = 0; i < list.length; i++) {
      var top = list[i].el.getBoundingClientRect().top + window.scrollY;
      if (top <= mid) best = list[i].text; else break;
    }
    return best;
  }

  /* ---------- CSV ---------- */

  var COLS = ["timestamp", "reviewer", "page", "page_title", "section", "category", "comment", "viewport", "sent"];

  function csvCell(v) {
    var s = (v === null || v === undefined) ? "" : String(v);
    /* Always quote. Covers commas, quotes, newlines, and leading characters
       spreadsheets would otherwise interpret as a formula. */
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function toCSV(rows) {
    var out = [COLS.map(csvCell).join(",")];
    rows.forEach(function (r) {
      out.push(COLS.map(function (c) { return csvCell(r[c]); }).join(","));
    });
    return out.join("\r\n");
  }

  function download(rows) {
    var blob = new Blob(["﻿" + toCSV(rows)], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ncaf-course-feedback-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- send ---------- */

  function send(row) {
    if (!ENDPOINT) return Promise.resolve(false);
    /* text/plain avoids a CORS preflight, which Apps Script web apps do not
       answer. Apps Script reads the body from e.postData.contents. */
    return fetch(ENDPOINT, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(row)
    })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  function flush() {
    if (!ENDPOINT) return;
    var rows = read();
    var pending = rows.filter(function (r) { return !r.sent; });
    if (!pending.length) return;
    var chain = Promise.resolve();
    pending.forEach(function (r) {
      chain = chain.then(function () {
        return send(r).then(function (ok) { if (ok) r.sent = "yes"; });
      });
    });
    chain.then(function () { write(rows); paintBadge(); });
  }

  /* ---------- styles ---------- */

  var CSS = [
    '#ncaf-fb,#ncaf-fb *{box-sizing:border-box;font-family:"Public Sans",system-ui,-apple-system,sans-serif}',
    '#ncaf-fb{position:fixed;right:1rem;bottom:1rem;z-index:9999;font-size:15px;line-height:1.5}',
    '@media(max-width:560px){#ncaf-fb{right:.65rem;bottom:.65rem;left:.65rem}}',
    '#ncaf-fb .fb-open{display:flex;align-items:center;gap:.5rem;margin-left:auto;background:#14302A;color:#EAF1EC;border:none;border-radius:999px;padding:.6rem 1.05rem;font-size:.9rem;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(20,48,42,.28)}',
    '#ncaf-fb .fb-open:hover{background:#24493D}',
    '#ncaf-fb .fb-open .dot{background:#B0740F;color:#fff;border-radius:999px;min-width:1.25rem;height:1.25rem;display:grid;place-items:center;font-size:.72rem;padding:0 .3rem}',
    '#ncaf-fb .fb-panel{display:none;width:min(24rem,calc(100vw - 1.3rem));max-height:min(40rem,calc(100vh - 2.5rem));overflow-y:auto;background:#FAF8F3;border:1px solid #CBD7C6;border-radius:12px;box-shadow:0 12px 40px rgba(20,48,42,.22);padding:1.1rem 1.15rem}',
    '#ncaf-fb.is-open .fb-panel{display:block}',
    '#ncaf-fb.is-open .fb-open{display:none}',
    '#ncaf-fb .fb-head{display:flex;align-items:baseline;gap:.5rem;margin-bottom:.15rem}',
    '#ncaf-fb .fb-head h3{font-family:"Zilla Slab",Georgia,serif;font-size:1.12rem;margin:0;color:#14302A;font-weight:600}',
    '#ncaf-fb .fb-x{margin-left:auto;background:none;border:none;font-size:1.3rem;line-height:1;color:#6E837A;cursor:pointer;padding:0 .15rem}',
    '#ncaf-fb .fb-x:hover{color:#14302A}',
    '#ncaf-fb .fb-sub{font-size:.85rem;color:#6E837A;margin:0 0 .9rem}',
    '#ncaf-fb label{display:block;font-size:.78rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#6E837A;margin:.75rem 0 .3rem}',
    '#ncaf-fb input,#ncaf-fb select,#ncaf-fb textarea{width:100%;font-family:inherit;font-size:.93rem;color:#14302A;background:#fff;border:1px solid #CBD7C6;border-radius:6px;padding:.5rem .6rem}',
    '#ncaf-fb textarea{min-height:6.5rem;resize:vertical;line-height:1.5}',
    '#ncaf-fb input:focus,#ncaf-fb select:focus,#ncaf-fb textarea:focus{outline:2px solid #B0740F;outline-offset:1px;border-color:#2E5D4E}',
    '#ncaf-fb .fb-ctx{background:#E5ECE2;border:1px solid #CBD7C6;border-radius:6px;padding:.5rem .65rem;font-size:.82rem;color:#3B534A;margin-bottom:.2rem}',
    '#ncaf-fb .fb-ctx b{color:#14302A}',
    '#ncaf-fb .fb-row{display:flex;gap:.5rem;align-items:center;margin-top:.95rem}',
    '#ncaf-fb .fb-send{background:#2E5D4E;color:#fff;border:none;border-radius:6px;padding:.55rem 1.05rem;font-size:.92rem;font-weight:600;cursor:pointer}',
    '#ncaf-fb .fb-send:hover{background:#24493D}',
    '#ncaf-fb .fb-send:disabled{background:#CBD7C6;color:#6E837A;cursor:not-allowed}',
    '#ncaf-fb .fb-link{background:none;border:none;color:#2E5D4E;font-size:.85rem;font-weight:600;cursor:pointer;padding:.2rem}',
    '#ncaf-fb .fb-link:hover{text-decoration:underline}',
    '#ncaf-fb .fb-ok{background:#E5ECE2;border:1px solid #2E5D4E;color:#2E5D4E;border-radius:6px;padding:.6rem .7rem;font-size:.88rem;margin-top:.8rem}',
    '#ncaf-fb .fb-note{font-size:.78rem;color:#6E837A;margin-top:.7rem;line-height:1.45}',
    '#ncaf-fb .fb-list{margin-top:.6rem;border-top:1px solid #CBD7C6;padding-top:.6rem}',
    '#ncaf-fb .fb-item{border-bottom:1px solid #F1EEE5;padding:.55rem 0;font-size:.85rem}',
    '#ncaf-fb .fb-item:last-child{border-bottom:none}',
    '#ncaf-fb .fb-item .m{color:#6E837A;font-size:.76rem;display:flex;gap:.4rem;flex-wrap:wrap}',
    '#ncaf-fb .fb-item .c{color:#14302A;margin-top:.15rem}',
    '#ncaf-fb .fb-unsent{color:#B0740F;font-weight:700}',
    '#ncaf-fb .fb-empty{font-size:.86rem;color:#6E837A;padding:.6rem 0}'
  ].join("");

  /* ---------- build ---------- */

  function init() {
    if (document.getElementById("ncaf-fb")) return;

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.id = "ncaf-fb";
    root.innerHTML =
      '<button class="fb-open" type="button" aria-label="Give feedback on this page">' +
        '<span>Feedback</span><span class="dot" id="fbDot" hidden>0</span>' +
      '</button>' +
      '<div class="fb-panel" role="dialog" aria-label="Page feedback">' +
        '<div class="fb-head"><h3 id="fbTitle">Note on this page</h3>' +
          '<button class="fb-x" type="button" aria-label="Close">&times;</button></div>' +
        '<p class="fb-sub" id="fbSub">Tell the team what to change. Saved on this device.</p>' +
        '<div id="fbForm">' +
          '<div class="fb-ctx" id="fbCtx"></div>' +
          '<label for="fbSection">Which part</label>' +
          '<select id="fbSection"></select>' +
          '<label for="fbCat">Type</label>' +
          '<select id="fbCat"></select>' +
          '<label for="fbText">What should change?</label>' +
          '<textarea id="fbText" placeholder="Be specific. Quote the sentence if you can."></textarea>' +
          '<label for="fbWho">Your name</label>' +
          '<input id="fbWho" type="text" placeholder="Suhan" autocomplete="name">' +
          '<div class="fb-row">' +
            '<button class="fb-send" id="fbSend" type="button" disabled>Save note</button>' +
            '<button class="fb-link" id="fbView" type="button">View all</button>' +
          '</div>' +
          '<p class="fb-note" id="fbNote"></p>' +
        '</div>' +
        '<div id="fbReview" hidden>' +
          '<div class="fb-row" style="margin-top:.2rem">' +
            '<button class="fb-send" id="fbCsv" type="button">Download CSV</button>' +
            '<button class="fb-link" id="fbBack" type="button">Add another</button>' +
            '<button class="fb-link" id="fbClear" type="button" style="margin-left:auto;color:#A2412A">Clear</button>' +
          '</div>' +
          '<div class="fb-list" id="fbList"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    var openBtn = root.querySelector(".fb-open");
    var closeBtn = root.querySelector(".fb-x");
    var selSection = root.querySelector("#fbSection");
    var selCat = root.querySelector("#fbCat");
    var txt = root.querySelector("#fbText");
    var who = root.querySelector("#fbWho");
    var sendBtn = root.querySelector("#fbSend");
    var noteEl = root.querySelector("#fbNote");
    var formEl = root.querySelector("#fbForm");
    var reviewEl = root.querySelector("#fbReview");

    CATEGORIES.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c; o.textContent = c;
      selCat.appendChild(o);
    });

    who.value = getWho();
    noteEl.textContent = ENDPOINT
      ? "Notes are saved here and sent to the shared sheet."
      : "No shared sheet is configured yet, so notes stay on this device. Export the CSV and send it to Suhan.";

    function fillSections() {
      var hs = headings();
      var cur = currentSection(hs);
      selSection.innerHTML = "";
      var opts = hs.map(function (h) { return h.text; });
      if (!opts.length) opts = ["(whole page)"];
      if (opts.indexOf("(whole page)") === -1) opts.unshift("(whole page)");
      opts.forEach(function (t) {
        var o = document.createElement("option");
        o.value = t; o.textContent = t.length > 60 ? t.slice(0, 57) + "…" : t;
        selSection.appendChild(o);
      });
      selSection.value = cur && opts.indexOf(cur) !== -1 ? cur : "(whole page)";
      root.querySelector("#fbCtx").innerHTML =
        "<b>" + escapeHtml(document.title || pageSlug()) + "</b><br>" + escapeHtml(pageSlug() + ".html");
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }

    function paintList() {
      var rows = read().slice().reverse();
      var list = root.querySelector("#fbList");
      if (!rows.length) {
        list.innerHTML = '<p class="fb-empty">No notes yet.</p>';
        return;
      }
      list.innerHTML = rows.map(function (r) {
        return '<div class="fb-item"><div class="m">' +
          '<span>' + escapeHtml(r.page) + '</span>' +
          '<span>&middot;</span><span>' + escapeHtml((r.section || "").slice(0, 34)) + '</span>' +
          (r.sent === "yes" ? "" : '<span class="fb-unsent">unsent</span>') +
          '</div><div class="c">' + escapeHtml(r.comment) + '</div></div>';
      }).join("");
    }

    function showForm() { formEl.hidden = false; reviewEl.hidden = true; root.querySelector("#fbTitle").textContent = "Note on this page"; }
    function showReview() {
      formEl.hidden = true; reviewEl.hidden = false;
      root.querySelector("#fbTitle").textContent = "All notes on this device";
      paintList();
    }

    function open() {
      root.classList.add("is-open");
      fillSections();
      showForm();
      setTimeout(function () { txt.focus(); }, 60);
    }
    function close() { root.classList.remove("is-open"); }

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("is-open")) close();
    });

    txt.addEventListener("input", function () { sendBtn.disabled = !txt.value.trim(); });

    sendBtn.addEventListener("click", function () {
      var comment = txt.value.trim();
      if (!comment) return;
      setWho(who.value.trim());

      var row = {
        timestamp: new Date().toISOString(),
        reviewer: who.value.trim() || "anonymous",
        page: pageSlug(),
        page_title: document.title || "",
        section: selSection.value,
        category: selCat.value,
        comment: comment,
        viewport: window.innerWidth + "x" + window.innerHeight,
        sent: "no"
      };

      var rows = read();
      rows.push(row);
      write(rows);

      txt.value = "";
      sendBtn.disabled = true;
      paintBadge();

      var ok = document.createElement("div");
      ok.className = "fb-ok";
      ok.textContent = ENDPOINT ? "Saved. Sending to the shared sheet…" : "Saved on this device.";
      formEl.appendChild(ok);
      setTimeout(function () { if (ok.parentNode) ok.parentNode.removeChild(ok); }, 2600);

      if (ENDPOINT) {
        send(row).then(function (delivered) {
          if (delivered) {
            var all = read();
            for (var i = all.length - 1; i >= 0; i--) {
              if (all[i].timestamp === row.timestamp && all[i].comment === row.comment) {
                all[i].sent = "yes"; break;
              }
            }
            write(all);
            paintBadge();
          }
        });
      }
    });

    root.querySelector("#fbView").addEventListener("click", showReview);
    root.querySelector("#fbBack").addEventListener("click", function () { fillSections(); showForm(); });
    root.querySelector("#fbCsv").addEventListener("click", function () {
      var rows = read();
      if (!rows.length) return;
      download(rows);
    });
    root.querySelector("#fbClear").addEventListener("click", function () {
      var rows = read();
      var unsent = rows.filter(function (r) { return r.sent !== "yes"; }).length;
      var msg = unsent
        ? "Delete all " + rows.length + " notes? " + unsent + " have not been sent anywhere — download the CSV first if you need them."
        : "Delete all " + rows.length + " notes from this device?";
      if (!window.confirm(msg)) return;
      write([]);
      paintList();
      paintBadge();
    });

    window.paintBadgeRef = paintBadge;
    paintBadge();
    flush();
  }

  function paintBadge() {
    var dot = document.getElementById("fbDot");
    if (!dot) return;
    var rows = read();
    var n = window.NCAF_FEEDBACK_ENDPOINT
      ? rows.filter(function (r) { return r.sent !== "yes"; }).length
      : rows.length;
    dot.hidden = n === 0;
    dot.textContent = n;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
