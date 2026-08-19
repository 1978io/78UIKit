/* ==========================================================================
   78 UI Kit — _78.js
   One global (`_78`), no dependencies, no build step.
   v1 surface: _78.theme
   --------------------------------------------------------------------------
   PRE-PAINT SNIPPET — paste this inline in <head>, BEFORE any stylesheet, so
   the first paint is already the right theme (no FOUC). It is intentionally
   duplicated here as a string constant so it stays in sync with this file:

   <script>
   (function(){var p=localStorage.getItem('_78-theme')||'system';
   var t=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;
   var r=document.documentElement;r.dataset.theme=t;r.dataset.themePref=p;})();
   </script>
   ========================================================================== */

window._78 = window._78 || {};

(function (_78) {
  "use strict";

  var KEY = "_78-theme";              /* kit-neutral storage key */
  var ORDER = ["dark", "light", "system"];   /* cycle: Dark -> Light -> System */
  var LIGHT_MQ = "(prefers-color-scheme: light)";
  var root = document.documentElement;

  /* localStorage can throw (private mode, blocked cookies) — never break the page */
  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* no-op */ }
  }

  function normalise(pref) {
    return ORDER.indexOf(pref) === -1 ? "system" : pref;
  }

  /* The user's preference: "dark" | "light" | "system" */
  function pref() {
    return normalise(read());
  }

  /* What the preference resolves to right now: "dark" | "light" */
  function resolve(p) {
    p = normalise(p || pref());
    if (p !== "system") return p;
    return window.matchMedia(LIGHT_MQ).matches ? "light" : "dark";
  }

  /* Write the attributes the CSS keys off, then tell the page */
  function apply(p) {
    p = normalise(p);
    var theme = resolve(p);
    root.dataset.theme = theme;
    root.dataset.themePref = p;
    document.querySelectorAll("._78-theme-toggle").forEach(label);
    document.dispatchEvent(new CustomEvent("_78:themechange", {
      detail: { theme: theme, pref: p }
    }));
    return theme;
  }

  /* Set + persist */
  function set(p) {
    p = normalise(p);
    write(p);
    return apply(p);
  }

  /* Dark -> Light -> System -> Dark */
  function cycle() {
    var next = ORDER[(ORDER.indexOf(pref()) + 1) % ORDER.length];
    set(next);
    return next;
  }

  function label(el) {
    var p = pref();
    var title = "Theme: " + p.charAt(0).toUpperCase() + p.slice(1) + " (click to change)";
    el.setAttribute("title", title);
    el.setAttribute("aria-label", title);
  }

  /* Wire a toggle button. Safe to call twice on the same element. */
  function mount(el) {
    el = el || document.querySelector("._78-theme-toggle");
    if (!el || el.dataset._78ThemeMounted) return el;
    el.dataset._78ThemeMounted = "1";
    el.classList.add("_78-theme-toggle");
    if (!el.hasAttribute("type") && el.tagName === "BUTTON") el.type = "button";
    el.addEventListener("click", function () { cycle(); });
    label(el);
    return el;
  }

  /* Live-follow the OS only while the preference is "system" */
  var mq = window.matchMedia(LIGHT_MQ);
  var onOsChange = function () { if (pref() === "system") apply("system"); };
  if (mq.addEventListener) mq.addEventListener("change", onOsChange);
  else if (mq.addListener) mq.addListener(onOsChange);           /* Safari < 14 */

  /* Another tab changed the theme */
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) apply(pref());
  });

  function init() {
    apply(pref());                                     /* idempotent w/ pre-paint */
    document.querySelectorAll("._78-theme-toggle").forEach(mount);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  _78.theme = {
    get pref() { return pref(); },        /* "dark" | "light" | "system"   */
    get current() { return resolve(); },  /* "dark" | "light"              */
    set: set,
    cycle: cycle,
    apply: apply,
    mount: mount,
    KEY: KEY,
    /* The exact pre-paint snippet, for docs/tooling */
    PREPAINT: "(function(){var p=localStorage.getItem('_78-theme')||'system';"
            + "var t=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;"
            + "var r=document.documentElement;r.dataset.theme=t;r.dataset.themePref=p;})();"
  };
})(window._78);
