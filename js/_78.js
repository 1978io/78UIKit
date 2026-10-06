/* ==========================================================================
   78 UI Kit — _78.js
   One global (`_78`), no dependencies, no build step.

   Surface: _78.theme · _78.tone · _78.util · _78.shell · _78.modal · _78.notify · _78.tabs · _78.seg · _78.viz · _78.toc

   ⭐ Which notification? — the rule, so nobody has to guess:
      MODAL  needs acknowledgement (errors, confirms) — blocks, requires a click
             _78.modal.open({title, body, actions}) → Promise<action value|null>
             _78.modal.confirm(msg) → Promise<boolean> · .alert(msg) → Promise<boolean>
             (true = the button was clicked, false = dismissed)
      TOAST  informational ("Saved", "Copied")        — auto-dismisses, never blocks
             _78.notify(msg, {type, duration}) · .success/.error (= .danger)/.warn/.info
      INLINE tied to a region (form errors, empty)    — sits in the layout, persists
             the ._78-alert component (CSS); any ._78-alert-close is wired here
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

  function normalize(pref) {
    return ORDER.indexOf(pref) === -1 ? "system" : pref;
  }

  /* The user's preference: "dark" | "light" | "system" */
  function pref() {
    return normalize(read());
  }

  /* What the preference resolves to right now: "dark" | "light" */
  function resolve(p) {
    p = normalize(p || pref());
    if (p !== "system") return p;
    return window.matchMedia(LIGHT_MQ).matches ? "light" : "dark";
  }

  /* Write the attributes the CSS keys off, then tell the page */
  function apply(p) {
    p = normalize(p);
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
    p = normalize(p);
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

/* ==========================================================================
   _78.tone — the one tone vocabulary
   Canonical names are the token names: accent · success · warn · danger ·
   info · dim. green / red / amber / yellow are permanent aliases. Every JS
   option that takes a tone runs through this, so a CSS class and a JS option
   accept exactly the same words.

     _78.tone("red")    → "danger"
     _78.tone("info")   → "info"
     _78.tone("nope")   → null
     _78.tone.names     → ["accent", "success", "warn", "danger", "info", "dim"]
     _78.tone.categories → ["cat-1" … "cat-6"]   (labels that are not states)
   ========================================================================== */
(function (_78) {
  "use strict";

  var NAMES = ["accent", "success", "warn", "danger", "info", "dim"];
  var ALIASES = { green: "success", red: "danger", amber: "warn", yellow: "warn" };
  /* Categories: labels that are not states. Accepted wherever a tone is, but
     only badges, tags, text and the viz primitives style them. */
  var CATEGORIES = ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5", "cat-6"];

  function tone(name) {
    if (name == null) return null;
    name = String(name).trim().toLowerCase();
    if (ALIASES[name]) return ALIASES[name];
    return NAMES.indexOf(name) !== -1 || CATEGORIES.indexOf(name) !== -1 ? name : null;
  }
  tone.names = NAMES.slice();
  tone.aliases = Object.assign({}, ALIASES);
  tone.categories = CATEGORIES.slice();

  _78.tone = tone;
})(window._78);

/* ==========================================================================
   _78.util — two small, dependency-free helpers (no DOM)

     list.sort(_78.util.sortAlpha)          "Item 2" before "Item 10"
     _78.util.duration(7500000)             "2 hrs 5 min"

   sortAlpha(a, b) is a comparator for human sorting: case-insensitive,
   locale-aware, numbers compared as numbers. Blanks (null / undefined / "")
   sort after everything else. Its signature fits Array.prototype.sort and a
   Tabulator column's `sorter` as-is.

   duration(ms, { long, parts }) turns milliseconds into plain English:
     long   false (default) "45 sec" "3 min" "2 hrs" "3 days"
            true            "45 seconds" "3 minutes" "2 hours" "3 days"
     parts  how many units at most (default 2): "2 hrs 5 min", "3 days 4 hrs"
   The last part shown is rounded (with carry: 59.6 min is "1 hr"), and a part
   that rounds to zero is left out, so it never prints "0 min". Under a second
   is "< 1 sec" (either sign); 0 is "0 sec"; negatives get a leading "-"; days are the
   largest unit ("1,200 days"); anything that isn't a finite number is "".
   ========================================================================== */
(function (_78) {
  "use strict";

  var collator = typeof Intl !== "undefined" && Intl.Collator
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
    : null;

  function sortAlpha(a, b) {
    var blankA = a == null || a === "", blankB = b == null || b === "";
    if (blankA || blankB) return blankA === blankB ? 0 : (blankA ? 1 : -1);
    a = String(a); b = String(b);
    if (collator) return collator.compare(a, b);
    a = a.toLowerCase(); b = b.toLowerCase();
    return a < b ? -1 : a > b ? 1 : 0;
  }

  var UNITS = [
    { ms: 86400000, short: ["day", "days"], long: ["day", "days"] },
    { ms: 3600000,  short: ["hr", "hrs"],   long: ["hour", "hours"] },
    { ms: 60000,    short: ["min", "min"],  long: ["minute", "minutes"] },
    { ms: 1000,     short: ["sec", "sec"],  long: ["second", "seconds"] }
  ];

  function duration(ms, opts) {
    opts = opts || {};
    ms = Number(ms);
    if (!isFinite(ms)) return "";
    var names = opts.long ? "long" : "short";
    var parts = Math.max(1, Math.floor(opts.parts) || 2);
    var sign = ms < 0 ? "-" : "";
    var abs = Math.abs(ms);
    var num = function (n) { return n.toLocaleString ? n.toLocaleString("en-US") : String(n); };
    var say = function (n, u) { return num(n) + " " + u[names][n === 1 ? 0 : 1]; };

    if (abs === 0) return say(0, UNITS[3]);
    if (abs < 1000) return "< " + say(1, UNITS[3]);          /* no "-< 1 sec" */

    var first = function (v) {
      for (var i = 0; i < UNITS.length; i++) if (v >= UNITS[i].ms) return i;
      return UNITS.length - 1;
    };
    /* Round to the smallest unit that will be shown, then re-pick the largest
       unit — rounding can carry (59.6 min → 60 min → 1 hr). */
    var i = first(abs);
    var step = UNITS[Math.min(i + parts - 1, UNITS.length - 1)].ms;
    abs = Math.round(abs / step) * step;
    i = first(abs);
    var last = Math.min(i + parts - 1, UNITS.length - 1);

    var out = [];
    for (var k = i; k <= last; k++) {
      var n = Math.floor(abs / UNITS[k].ms);
      abs -= n * UNITS[k].ms;
      if (n > 0) out.push(say(n, UNITS[k]));
    }
    return sign + out.join(" ");
  }

  _78.util = { sortAlpha: sortAlpha, duration: duration };
})(window._78);

/* ==========================================================================
   _78.modal — native <dialog>, always via showModal()
   showModal() is what buys the top layer, the ::backdrop, the focus trap and
   Escape. show() gives you none of that, which is why it is never used here.

   Text is inserted with textContent, never innerHTML — pass `html: true`
   (or a Node) when you genuinely mean markup.
   ========================================================================== */
(function (_78) {
  "use strict";

  var seq = 0;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function content(node, value, asHtml) {
    if (value == null) return node;
    if (value.nodeType) node.appendChild(value);
    else if (asHtml) node.innerHTML = String(value);
    else String(value).split("\n").forEach(function (line) {
      node.appendChild(el("p", null, line));
    });
    return node;
  }

  var CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    + 'stroke-width="2" stroke-linecap="round" aria-hidden="true">'
    + '<path d="M18 6 6 18M6 6l12 12"/></svg>';

  /* <form method="dialog"> — this button closes the dialog with zero JS */
  function closeButton() {
    var form = el("form", "_78-modal-close");
    form.method = "dialog";
    var btn = el("button", "_78-icon-btn");
    btn.type = "submit";
    btn.value = "";                              /* dismissed, not chosen */
    btn.setAttribute("aria-label", "Close");
    btn.innerHTML = CLOSE_ICON;
    form.appendChild(btn);
    return form;
  }

  /* Backdrop click to dismiss, and Escape held off when the dialog is not
     dismissible. Safe to call twice on the same dialog. */
  function mount(dialog) {
    if (!dialog || dialog.dataset._78ModalMounted) return dialog;
    dialog.dataset._78ModalMounted = "1";
    dialog.classList.add("_78-modal");

    var locked = function () { return dialog.dataset._78Dismissible === "false"; };
    dialog.addEventListener("click", function (e) {
      /* the backdrop IS the dialog element — its children cover the box */
      if (e.target === dialog && !locked()) dialog.close("");
    });
    /* Both, because Chrome only lets `cancel` be prevented once per user
       activation; stopping the keydown is what holds on a second Escape. */
    dialog.addEventListener("cancel", function (e) { if (locked()) e.preventDefault(); });
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && locked()) e.preventDefault();
    });
    return dialog;
  }

  /* Open any <dialog> and resolve with its returnValue when it closes. */
  function show(dialog) {
    mount(dialog);
    return new Promise(function (resolve) {
      dialog.addEventListener("close", function handler() {
        dialog.removeEventListener("close", handler);
        resolve(dialog.returnValue);
      });
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");      /* pre-<dialog> browser: no trap */
    });
  }

  /*  open({ title, body, html, actions, size, tone, dismissible })
      → Promise resolving to the chosen action's `value`, or null when the
        user dismissed it (Escape, backdrop, the × button).                */
  function open(opts) {
    opts = opts || {};

    var actions = opts.actions || [{ label: "OK", value: true, variant: "primary", autofocus: true }];
    var dismissible = opts.dismissible !== false;

    var dialog = el("dialog", "_78-modal");
    if (opts.size === "sm") dialog.classList.add("_78-modal-sm");
    if (opts.size === "lg") dialog.classList.add("_78-modal-lg");
    /* a known tone or alias maps to its canonical class; any other string is
       passed through, so a tone of your own (with your own CSS) still works */
    if (opts.tone) dialog.classList.add("_78-modal-" + (_78.tone(opts.tone) || opts.tone));
    if (opts.className) dialog.className += " " + opts.className;
    dialog.dataset._78Dismissible = dismissible ? "true" : "false";

    if (opts.title || dismissible) {
      var head = el("div", "_78-modal-head");
      var titleId = "_78-modal-title-" + (++seq);
      var title = el("h2", "_78-modal-title", opts.title || "");
      title.id = titleId;
      dialog.setAttribute("aria-labelledby", titleId);
      head.appendChild(title);
      if (dismissible) head.appendChild(closeButton());
      dialog.appendChild(head);
    }

    dialog.appendChild(content(el("div", "_78-modal-body"), opts.body, opts.html));

    var foot = el("div", "_78-modal-foot");
    actions.forEach(function (action, i) {
      var btn = el("button", "_78-btn" + (action.variant ? " _78-btn-" + action.variant : ""), action.label);
      btn.type = "button";
      btn.addEventListener("click", function () { dialog.close(String(i)); });
      if (action.autofocus) btn.autofocus = true;
      foot.appendChild(btn);
    });
    if (actions.length) dialog.appendChild(foot);

    document.body.appendChild(dialog);

    return show(dialog).then(function (returnValue) {
      dialog.remove();
      var index = parseInt(returnValue, 10);
      return isNaN(index) || !actions[index] ? null : actions[index].value;
    });
  }

  /*  confirm(msg, opts) → Promise<boolean>
        true only for the Confirm button; false for Cancel and for every
        dismissal (×, Escape, backdrop).                                    */
  function confirm(message, opts) {
    opts = opts || {};
    return open({
      title: opts.title || "Are you sure?",
      body: message,
      html: opts.html,
      size: opts.size || "sm",
      tone: opts.tone,
      dismissible: opts.dismissible,
      actions: [
        { label: opts.cancelLabel || "Cancel", value: false, variant: "ghost" },
        { label: opts.confirmLabel || "Confirm", value: true,
          variant: _78.tone(opts.tone) === "danger" ? "danger" : "primary", autofocus: true }
      ]
    }).then(function (value) { return value === true; });
  }

  /*  alert(msg, opts) → Promise<boolean>
        true when OK was clicked; false on any dismissal (×, Escape,
        backdrop). Don't hang a side effect off the promise alone:
        `if (await _78.modal.alert(msg)) reload()`.                         */
  function alert(message, opts) {
    opts = opts || {};
    return open({
      title: opts.title || "Heads up",
      body: message,
      html: opts.html,
      size: opts.size || "sm",
      tone: opts.tone,
      dismissible: opts.dismissible,
      actions: [{ label: opts.okLabel || "OK", value: true, variant: "primary", autofocus: true }]
    }).then(function (value) { return value === true; });
  }

  _78.modal = {
    open: open,
    confirm: confirm,
    alert: alert,
    mount: mount,
    show: show            /* open a <dialog> you wrote yourself, declaratively */
  };
})(window._78);


/* ==========================================================================
   _78.notify — toasts
   Informational only: they auto-dismiss and never block. Anything that needs
   an answer is a modal; anything tied to a region is an ._78-alert.
   ========================================================================== */
(function (_78) {
  "use strict";

  var DEFAULT_MS = 4000;
  var ERROR_MS = 6000;          /* errors get longer — they matter more */
  var container = null;

  function stack() {
    if (container && document.body.contains(container)) return container;
    container = document.createElement("div");
    container.className = "_78-toasts";
    document.body.appendChild(container);
    return container;
  }

  function remove(toast) {
    if (!toast || toast.dataset._78Closing) return;
    toast.dataset._78Closing = "1";
    toast.classList.add("_78-toast-out");
    var done = function () { if (toast.parentNode) toast.remove(); };
    toast.addEventListener("animationend", done);
    setTimeout(done, 600);        /* animation may be off (reduced motion) */
  }

  /*  notify(message, { type, duration, title, html })
      duration: ms, 0 = sticky (close button only). Returns { el, close }. */
  function notify(message, opts) {
    opts = opts || {};
    /* Any tone name or alias works as a type. "error" is the toast's own word
       for danger, and keeps meaning "announce now, stay longer". */
    var type = opts.type || "default";
    var t = type === "error" ? "danger" : _78.tone(type);
    if (t) type = t === "danger" ? "error" : t;
    var duration = opts.duration != null ? opts.duration
                 : (type === "error" ? ERROR_MS : DEFAULT_MS);

    var toast = document.createElement("div");
    toast.className = "_78-toast" + (type === "default" ? "" : " _78-toast-" + type);
    /* role=alert is announced immediately; role=status waits for a pause */
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

    var body = document.createElement("div");
    body.className = "_78-toast-body";
    if (opts.title) {
      var title = document.createElement("div");
      title.className = "_78-toast-title";
      title.textContent = opts.title;
      body.appendChild(title);
    }
    var msg = document.createElement("div");
    msg.className = "_78-toast-msg";
    if (message && message.nodeType) msg.appendChild(message);
    else if (opts.html) msg.innerHTML = String(message);
    else msg.textContent = String(message == null ? "" : message);
    body.appendChild(msg);
    toast.appendChild(body);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "_78-toast-close";
    close.setAttribute("aria-label", "Dismiss");
    close.textContent = "×";
    close.addEventListener("click", function () { remove(toast); });
    toast.appendChild(close);

    stack().appendChild(toast);

    var timer = duration > 0 ? setTimeout(function () { remove(toast); }, duration) : null;

    return {
      el: toast,
      close: function () { if (timer) clearTimeout(timer); remove(toast); }
    };
  }

  /* .danger is the canonical-name spelling of .error; both do the same */
  ["success", "error", "danger", "warn", "info"].forEach(function (type) {
    notify[type] = function (message, opts) {
      opts = opts || {};
      opts.type = type;
      return notify(message, opts);
    };
  });

  _78.notify = notify;

  /* Inline alerts are pure CSS — the one behavior they have is dismissal. */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("._78-alert-close");
    if (!btn) return;
    var alert = btn.closest("._78-alert");
    if (alert) alert.remove();
  });
})(window._78);


/* ==========================================================================
   _78.tabs — click + arrow keys, full ARIA
   Automatic activation (the panel follows focus): the WAI-ARIA pattern for
   panels that are cheap to show.
   ========================================================================== */
(function (_78) {
  "use strict";

  var seq = 0;

  function panelOf(tab) {
    var id = tab.dataset.tab || tab.getAttribute("aria-controls");
    return id ? document.getElementById(id) : null;
  }

  function mount(list) {
    if (!list) return null;
    if (list.dataset._78TabsMounted) return list._78tabs;

    var tabs = Array.prototype.slice.call(list.querySelectorAll("._78-tab"));
    if (!tabs.length) return null;
    list.dataset._78TabsMounted = "1";

    var group = ++seq;
    list.setAttribute("role", "tablist");

    tabs.forEach(function (tab, i) {
      if (tab.tagName === "BUTTON" && !tab.hasAttribute("type")) tab.type = "button";
      if (!tab.id) tab.id = "_78-tab-" + group + "-" + i;
      tab.setAttribute("role", "tab");
      var panel = panelOf(tab);
      if (panel) {
        tab.setAttribute("aria-controls", panel.id);
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        panel.classList.add("_78-tabpanel");
        if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;
      }
      tab.addEventListener("click", function () { select(i); });
    });

    function select(index, moveFocus) {
      index = Math.max(0, Math.min(index, tabs.length - 1));
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        var panel = panelOf(tab);
        if (panel) panel.hidden = !on;
      });
      if (moveFocus) tabs[index].focus();
      list.dispatchEvent(new CustomEvent("_78:tabchange", {
        bubbles: true,
        detail: { index: index, tab: tabs[index], panel: panelOf(tabs[index]), id: tabs[index].id }
      }));
      return index;
    }

    function current() {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].getAttribute("aria-selected") === "true") return i;
      }
      return 0;
    }

    list.addEventListener("keydown", function (e) {
      var step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };
      if (e.key in step) {
        select((current() + step[e.key] + tabs.length) % tabs.length, true);
      } else if (e.key === "Home") {
        select(0, true);
      } else if (e.key === "End") {
        select(tabs.length - 1, true);
      } else {
        return;
      }
      e.preventDefault();
    });

    /* Initial state: whatever is marked selected, else the first tab */
    var initial = 0;
    tabs.forEach(function (t, i) {
      if (t.getAttribute("aria-selected") === "true" || t.classList.contains("_78-active")) initial = i;
    });
    select(initial);

    list._78tabs = { el: list, tabs: tabs, select: select };
    return list._78tabs;
  }

  function mountAll(scope) {
    return Array.prototype.slice
      .call((scope || document).querySelectorAll("._78-tabs"))
      .map(mount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mountAll(); });
  } else {
    mountAll();
  }

  _78.tabs = { mount: mount, mountAll: mountAll };
})(window._78);


/* ==========================================================================
   _78.seg — the segmented control: one of N, click + arrow keys, full ARIA
   A radio group in behavior (exactly one value), so that is the role it
   announces. Tabs own panels; this owns a value — it fires _78:segchange and
   leaves the rest to you.
   ========================================================================== */
(function (_78) {
  "use strict";

  var seq = 0;

  function mount(group) {
    if (!group) return null;
    if (group.dataset._78SegMounted) return group._78seg;

    var btns = Array.prototype.slice.call(group.querySelectorAll("._78-seg-btn"));
    if (!btns.length) return null;
    group.dataset._78SegMounted = "1";

    var id = ++seq;
    if (!group.hasAttribute("role")) group.setAttribute("role", "radiogroup");

    btns.forEach(function (btn, i) {
      if (btn.tagName === "BUTTON" && !btn.hasAttribute("type")) btn.type = "button";
      if (!btn.id) btn.id = "_78-seg-" + id + "-" + i;
      btn.setAttribute("role", "radio");
      btn.addEventListener("click", function () {
        if (disabled(btn)) return;
        select(i);
      });
    });

    function disabled(btn) {
      return btn.disabled || btn.getAttribute("aria-disabled") === "true";
    }

    function select(index, moveFocus) {
      index = Math.max(0, Math.min(index, btns.length - 1));
      btns.forEach(function (btn, i) {
        var on = i === index;
        btn.setAttribute("aria-checked", on ? "true" : "false");
        btn.classList.toggle("_78-active", on);
        /* roving tabindex: the group is one tab stop, arrows move inside it */
        btn.tabIndex = on ? 0 : -1;
      });
      if (moveFocus) btns[index].focus();
      group.dispatchEvent(new CustomEvent("_78:segchange", {
        bubbles: true,
        detail: {
          index: index,
          button: btns[index],
          value: btns[index].dataset.value != null
            ? btns[index].dataset.value
            : btns[index].textContent.trim()
        }
      }));
      return index;
    }

    function current() {
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].getAttribute("aria-checked") === "true") return i;
      }
      return 0;
    }

    /* step past disabled buttons rather than landing on one */
    function move(from, step) {
      var i = from;
      for (var n = 0; n < btns.length; n++) {
        i = (i + step + btns.length) % btns.length;
        if (!disabled(btns[i])) return i;
      }
      return from;
    }

    function edge(step) {
      var i = step > 0 ? -1 : btns.length;
      return move(i, step);
    }

    group.addEventListener("keydown", function (e) {
      var step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };
      if (e.key in step) {
        select(move(current(), step[e.key]), true);
      } else if (e.key === "Home") {
        select(edge(1), true);
      } else if (e.key === "End") {
        select(edge(-1), true);
      } else {
        return;
      }
      e.preventDefault();
    });

    /* Initial value: whatever is marked checked/active, else the first button */
    var initial = 0;
    btns.forEach(function (b, i) {
      if (b.getAttribute("aria-checked") === "true" ||
          b.getAttribute("aria-pressed") === "true" ||
          b.classList.contains("_78-active")) initial = i;
    });
    /* set the state without announcing a change nobody made */
    btns.forEach(function (btn, i) {
      var on = i === initial;
      btn.setAttribute("aria-checked", on ? "true" : "false");
      btn.classList.toggle("_78-active", on);
      btn.tabIndex = on ? 0 : -1;
    });

    group._78seg = {
      el: group,
      buttons: btns,
      select: select,
      get index() { return current(); },
      get value() {
        var btn = btns[current()];
        return btn.dataset.value != null ? btn.dataset.value : btn.textContent.trim();
      }
    };
    return group._78seg;
  }

  function mountAll(scope) {
    return Array.prototype.slice
      .call((scope || document).querySelectorAll("._78-seg"))
      .map(mount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mountAll(); });
  } else {
    mountAll();
  }

  _78.seg = { mount: mount, mountAll: mountAll };
})(window._78);


/* ==========================================================================
   _78.viz — the no-library data-viz primitives
   Sparkline, progress bar, bar row, donut/gauge and split bar. Everything is
   inline SVG or plain elements painted with kit tokens, so a theme switch needs
   no redraw (unlike canvas — that's what js/adapters/chartjs.js is for).

   Call it, or let it auto-mount from attributes on load:
     <div data-values="4,7,6,9,12">…</div>        → sparkline
     <div class="_78-progress" data-pct="72">      → progress fill + aria
     <div class="_78-bar-row" data-pct="82">       → bar fill + aria
     <div class="_78-donut" data-pct="68">         → ring + center value
     <div class="_78-donut _78-gauge" data-pct="41">
     <div class="_78-split-bar">…</div>              → proportional segments

   🔴 Every primitive gets a text value or role="img" + aria-label. A shape or
   a color is never the only carrier of the meaning.
   ========================================================================== */
(function (_78) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function numbers(value) {
    if (Array.isArray(value)) return value.map(Number).filter(function (n) { return !isNaN(n); });
    if (typeof value !== "string") return [];
    return value.split(/[\s,]+/).map(Number).filter(function (n) { return !isNaN(n); });
  }

  function round(n) { return Math.round(n * 100) / 100; }

  /* --- Sparkline ---------------------------------------------------------
     sparkline(el, data, { width, height, fill, dot, tone, label })
     `data` may be omitted when the element carries data-values.
     ---------------------------------------------------------------------- */
  function sparkline(el, data, opts) {
    if (!el) return null;
    opts = opts || {};

    var values = numbers(data != null ? data : el.dataset.values);
    if (values.length < 2) return null;

    var W = opts.width || 120;
    var H = opts.height || 32;
    var pad = 2;                                  /* room for the stroke/dot */
    var showFill = opts.fill !== false && el.dataset.fill !== "false";
    /* the end-of-series dot is opt-in — it crowds a small card by default */
    var showDot = opts.dot != null ? opts.dot !== false : el.dataset.dot === "true";

    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var span = max - min;

    var points = values.map(function (v, i) {
      var x = values.length === 1 ? W / 2 : pad + (i / (values.length - 1)) * (W - pad * 2);
      /* a flat series draws down the middle rather than dividing by zero */
      var t = span === 0 ? 0.5 : (v - min) / span;
      var y = (H - pad) - t * (H - pad * 2);
      return [round(x), round(y)];
    });

    var line = points.map(function (p, i) { return (i ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
    var area = line + " L" + points[points.length - 1][0] + " " + H + " L" + points[0][0] + " " + H + " Z";

    var svg = svgEl("svg", {
      class: "_78-sparkline",
      viewBox: "0 0 " + W + " " + H,
      preserveAspectRatio: "none",
      role: "img",
      focusable: "false"
    });

    var tone = opts.tone || el.dataset.tone;
    if (tone === "auto") tone = values[values.length - 1] >= values[0] ? "success" : "danger";
    if (tone) svg.classList.add("_78-tone-" + (_78.tone(tone) || tone));

    /* Label: explicit, else a plain-English summary of the series */
    var change = values[values.length - 1] - values[0];
    var label = opts.label || el.dataset.label ||
      ("Trend, " + values.length + " points: " + values[0] + " to " + values[values.length - 1] +
       " (" + (change > 0 ? "up" : change < 0 ? "down" : "flat") + ")");
    svg.setAttribute("aria-label", label);
    svg.appendChild(svgEl("title", {})).textContent = label;

    if (showFill) svg.appendChild(svgEl("path", { class: "_78-sparkline-area", d: area }));
    svg.appendChild(svgEl("path", {
      class: "_78-sparkline-line",
      d: line,
      "vector-effect": "non-scaling-stroke"    /* stretch the box, not the line */
    }));
    if (showDot) {
      /* A zero-length path with a round cap, not a <circle>: the box stretches
         under preserveAspectRatio="none", and a circle's radius stretches with
         it (an ellipse), where a non-scaling stroke stays round. The size is the
         stroke width in CSS. The ring underneath is the --bg2 halo. */
      var last = points[points.length - 1];
      var d = "M" + last[0] + " " + last[1] + " l0 0";
      ["_78-sparkline-dot-ring", "_78-sparkline-dot"].forEach(function (cls) {
        svg.appendChild(svgEl("path", { class: cls, d: d, "vector-effect": "non-scaling-stroke" }));
      });
    }

    var existing = el.querySelector("svg._78-sparkline");
    if (existing) existing.remove();
    el.appendChild(svg);
    return svg;
  }

  /* --- Progress / score bar ----------------------------------------------
     progress(el, pct, { text, label })
     ---------------------------------------------------------------------- */
  function progress(el, pct, opts) {
    if (!el) return null;
    opts = opts || {};
    pct = clamp(parseFloat(pct != null ? pct : el.dataset.pct) || 0, 0, 100);

    var track = el.querySelector("._78-progress-track");
    if (!track) {
      track = document.createElement("div");
      track.className = "_78-progress-track";
      el.appendChild(track);
    }
    var fill = track.querySelector("._78-progress-fill");
    if (!fill) {
      fill = document.createElement("div");
      fill.className = "_78-progress-fill";
      track.appendChild(fill);
    }
    fill.style.width = pct + "%";

    var label = opts.label || el.dataset.label ||
      (el.querySelector("._78-progress-label") || {}).textContent || "";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-valuenow", String(round(pct)));
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    if (label) track.setAttribute("aria-label", label.trim());

    var value = el.querySelector("._78-progress-value");
    if (value && opts.text !== false && !value.textContent.trim()) {
      value.textContent = round(pct) + "%";
    }
    return el;
  }

  /* --- Bar row ------------------------------------------------------------ */
  function bar(el, pct, opts) {
    if (!el) return null;
    opts = opts || {};
    pct = clamp(parseFloat(pct != null ? pct : el.dataset.pct) || 0, 0, 100);

    var track = el.querySelector("._78-bar-track");
    if (!track) return null;
    var fill = track.querySelector("._78-bar-fill");
    if (!fill) {
      fill = document.createElement("span");
      fill.className = "_78-bar-fill";
      track.appendChild(fill);
    }
    fill.style.width = pct + "%";

    var label = opts.label || (el.querySelector("._78-bar-label") || {}).textContent || "";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-valuenow", String(round(pct)));
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    if (label) track.setAttribute("aria-label", label.trim());
    return el;
  }

  /* --- Donut / gauge -------------------------------------------------------
     donut(el, pct, { size, stroke, gauge, label, value })
     A gauge is the same ring drawn as a 240° arc with the gap at the bottom.
     ------------------------------------------------------------------------ */
  function donut(el, pct, opts) {
    if (!el) return null;
    opts = opts || {};
    pct = clamp(parseFloat(pct != null ? pct : el.dataset.pct) || 0, 0, 100);

    var isGauge = opts.gauge != null ? opts.gauge : el.classList.contains("_78-gauge");
    var size = opts.size || 100;
    var stroke = opts.stroke || (isGauge ? 11 : 12);
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var sweep = isGauge ? c * (240 / 360) : c;     /* how much of the ring is track */
    var filled = sweep * (pct / 100);
    var rotate = isGauge ? 150 : -90;              /* gauge gap at the bottom */
    var transform = "rotate(" + rotate + " " + (size / 2) + " " + (size / 2) + ")";
    var height = isGauge ? size * 0.86 : size;     /* trim the unused bottom */

    var svg = svgEl("svg", {
      viewBox: "0 0 " + size + " " + height,
      focusable: "false",
      "aria-hidden": "true"                        /* the wrapper carries the label */
    });
    var ring = { cx: size / 2, cy: size / 2, r: round(r), "stroke-width": stroke, transform: transform };

    svg.appendChild(svgEl("circle", Object.assign({}, ring, {
      class: "_78-donut-track",
      "stroke-dasharray": round(sweep) + " " + round(c - sweep + 0.001),
      "stroke-linecap": isGauge ? "round" : "butt"
    })));
    svg.appendChild(svgEl("circle", Object.assign({}, ring, {
      class: "_78-donut-fill",
      "stroke-dasharray": round(filled) + " " + round(c - filled + 0.001)
    })));

    var old = el.querySelector("svg");
    if (old) old.remove();
    el.insertBefore(svg, el.firstChild);

    /* Center text — respected if the markup already provides it */
    var center = el.querySelector("._78-donut-center");
    if (!center) {
      center = document.createElement("div");
      center.className = "_78-donut-center";
      el.appendChild(center);
    }
    var valueEl = center.querySelector("._78-donut-value");
    if (!valueEl) {
      valueEl = document.createElement("div");
      valueEl.className = "_78-donut-value";
      center.insertBefore(valueEl, center.firstChild);
    }
    if (!valueEl.textContent.trim() || opts.value != null || el.dataset.pct != null) {
      valueEl.textContent = opts.value != null ? opts.value : round(pct) + "%";
    }

    var label = opts.label || el.dataset.label || "";
    if (label && !center.querySelector("._78-donut-label")) {
      var labelEl = document.createElement("div");
      labelEl.className = "_78-donut-label";
      labelEl.textContent = label;
      center.appendChild(labelEl);
    }

    el.setAttribute("role", "img");
    el.setAttribute("aria-label", (label ? label + ": " : "") + valueEl.textContent);
    return el;
  }

  /* --- Trend arrow ---------------------------------------------------------
     trend(el, value, { invert, label }) — sets the direction class, the arrow
     and the text. Direction comes from the number's sign; "flat" at exactly 0.
     Markup-only use is fine too: <span class="_78-trend _78-up">▲ 12.4%</span>
     ------------------------------------------------------------------------ */
  var ARROWS = {
    up: "M12 5l7 8h-5v6h-4v-6H5z",
    down: "M12 19l-7-8h5V5h4v6h5z",
    flat: "M5 11h14v2H5z"
  };

  function trend(el, value, opts) {
    if (!el) return null;
    opts = opts || {};
    var n = parseFloat(value != null ? value : el.dataset.delta);
    var dir = isNaN(n) ? "flat" : (n > 0 ? "up" : n < 0 ? "down" : "flat");

    el.classList.add("_78-trend");
    el.classList.remove("_78-up", "_78-down", "_78-flat");
    el.classList.add("_78-" + dir);
    if (opts.invert || el.dataset.invert === "true") el.classList.add("_78-invert");

    /* an empty data-unit means "no unit" — hence != null, not || */
    var unit = opts.unit != null ? opts.unit
             : (el.dataset.unit != null ? el.dataset.unit : "%");
    var text = opts.text != null ? opts.text
             : (isNaN(n) ? el.textContent.trim() : (n > 0 ? "+" : "") + n + unit);

    el.textContent = "";
    var icon = svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
    icon.appendChild(svgEl("path", { d: ARROWS[dir], fill: "currentColor" }));
    el.appendChild(icon);
    el.appendChild(document.createTextNode(text));

    /* the word, for anyone who can't see the arrow or the color */
    var sr = document.createElement("span");
    sr.className = "_78-sr-only";
    sr.textContent = " " + (opts.label || (dir === "up" ? "up" : dir === "down" ? "down" : "no change"));
    el.appendChild(sr);
    return el;
  }

  /* --- Split bar -----------------------------------------------------------
     splitBar(el, segments, { label })
     Sizes ._78-split-seg children from their data-pct. `segments` may instead
     be an array — [{ pct, tone, label }] — and the children are built for you.
     Values do not have to be percentages: anything over a total of 100 is
     normalized, so raw amounts (1200 / 800) split correctly too.
     ---------------------------------------------------------------------- */
  function splitBar(el, segments, opts) {
    if (!el) return null;
    opts = opts || {};

    if (Array.isArray(segments)) {
      el.textContent = "";
      segments.forEach(function (s) {
        var seg = document.createElement("span");
        seg.className = "_78-split-seg" + (s.tone ? " _78-tone-" + (_78.tone(s.tone) || s.tone) : "");
        seg.dataset.pct = s.pct;
        if (s.label != null) seg.dataset.label = s.label;
        el.appendChild(seg);
      });
    }

    var segs = Array.prototype.slice.call(el.querySelectorAll("._78-split-seg"));
    if (!segs.length) return null;

    var values = segs.map(function (s) { return Math.max(0, parseFloat(s.dataset.pct) || 0); });
    var sum = values.reduce(function (a, b) { return a + b; }, 0);
    /* under 100 leaves the shortfall as visible track (spent vs remaining);
       over 100 means raw amounts, so share out the total instead */
    var total = sum > 100 ? sum : 100;

    var parts = [];
    segs.forEach(function (seg, i) {
      var share = total ? (values[i] / total) * 100 : 0;
      seg.style.width = round(share) + "%";
      var name = seg.dataset.label || "";
      var text = (name ? name + " " : "") + round(share) + "%";
      seg.setAttribute("title", text);
      if (name || share) parts.push(text);
    });

    el.setAttribute("role", "img");
    var label = opts.label || el.dataset.label;
    el.setAttribute("aria-label", (label ? label + ": " : "") + parts.join(", "));
    return el;
  }

  /* --- Auto-mount ---------------------------------------------------------- */
  function mountAll(scope) {
    scope = scope || document;
    var all = function (sel) { return Array.prototype.slice.call(scope.querySelectorAll(sel)); };

    all("[data-values]").forEach(function (el) { sparkline(el); });
    all("._78-progress[data-pct]").forEach(function (el) { progress(el); });
    all("._78-bar-row[data-pct]").forEach(function (el) { bar(el); });
    all("._78-donut[data-pct]").forEach(function (el) { donut(el); });
    all("._78-split-bar").forEach(function (el) { splitBar(el); });
    all("._78-trend[data-delta], ._78-stat-delta[data-delta]").forEach(function (el) { trend(el); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mountAll(); });
  } else {
    mountAll();
  }

  _78.viz = {
    sparkline: sparkline,
    progress: progress,
    bar: bar,
    donut: donut,
    splitBar: splitBar,
    trend: trend,
    mountAll: mountAll
  };
})(window._78);


/* ==========================================================================
   _78.shell — the app shell: topbar + sidebar (rail / drawer) + dropdown menus

   State lives on <html>, like the theme, so it survives a reload with no flash:
     data-sidebar="full" | "rail"    desktop width — persisted in localStorage
     data-drawer="open"              the mobile off-canvas drawer (runtime only)

   One button does both jobs: ._78-nav-toggle collapses the sidebar to a rail
   on desktop and opens the drawer on mobile.

   PRE-PAINT SNIPPET — paste this inline in <head> on any page that HAS a
   sidebar, next to the theme one, so the sidebar never flashes expanded and
   then snaps to a rail. It is duplicated here as _78.shell.PREPAINT.

   <script>
   (function(){try{var s=localStorage.getItem('_78-sidebar');
   document.documentElement.dataset.sidebar=s==='rail'?'rail':'full';}
   catch(e){document.documentElement.dataset.sidebar='full';}})();
   </script>

   🔴 Presence of [data-sidebar] is what makes room for the sidebar in the CSS,
   so a topbar-only page must NOT run the snippet. Without it, _78.shell sets
   the attribute on load instead — correct, but one frame late.
   ========================================================================== */
(function (_78) {
  "use strict";

  var KEY = "_78-sidebar";        /* "rail" | "full" — separate from _78-theme */
  var MOBILE = 768;               /* ⚠️ keep in sync with components/shell.css */
  var root = document.documentElement;
  var seq = 0;

  /* localStorage can throw (private mode, blocked cookies) — never break the page */
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* no-op */ } }

  function all(sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  }
  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  function isMobile() { return window.innerWidth <= MOBILE; }
  function sidebar() { return document.querySelector("._78-sidebar"); }
  function isRail() { return root.dataset.sidebar === "rail"; }
  function isDrawerOpen() { return root.dataset.drawer === "open"; }

  /* The toggle's aria-expanded answers "is the nav showing its labels?" —
     on mobile that is the drawer, on desktop it is full-vs-rail. */
  function syncToggles() {
    var expanded = isMobile() ? isDrawerOpen() : !isRail();
    all("._78-nav-toggle").forEach(function (t) {
      t.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  /* --- Rail (desktop) ------------------------------------------------------ */
  function setRail(on) {
    if (!sidebar()) return;
    root.dataset.sidebar = on ? "rail" : "full";
    write(on ? "rail" : "full");
    syncToggles();
    hideTip();
    emit("_78:railchange", { rail: !!on });
  }
  function toggleRail() { setRail(!isRail()); }

  /* --- Drawer (mobile) ----------------------------------------------------- */
  var lastFocus = null;
  var inerted = [];

  /* What Tab can land on inside the drawer, in order — visible ones only, so
     a control the drawer hides (the rail collapse button) is skipped. */
  var FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), "
    + "textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
  function focusables(scope) {
    return all(FOCUSABLE, scope).filter(function (n) { return n.getClientRects().length > 0; });
  }

  /* While the drawer is open the page behind it is inert, so neither Tab nor a
     screen reader's browse mode can wander into it. Two things stay live: the
     topbar, which sits above the scrim and holds the toggle that closes the
     drawer, and the scrim itself, which closes it on a click. */
  function setBackgroundInert(on) {
    if (!on) {
      inerted.forEach(function (n) { n.inert = false; });
      inerted = [];
      return;
    }
    var side = sidebar();
    for (var node = side; node && node !== document.body; node = node.parentElement) {
      Array.prototype.forEach.call(node.parentElement ? node.parentElement.children : [], function (sib) {
        if (sib === node || sib.inert || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(sib.tagName)) return;
        if (sib.matches("._78-topbar, ._78-scrim") || sib.querySelector("._78-nav-toggle")) return;
        sib.inert = true;
        inerted.push(sib);
      });
    }
  }

  /* Tab and Shift+Tab wrap inside the drawer. The page behind is inert, but
     the topbar is not, so without this Tab would walk out of the drawer. */
  function trapTab(e) {
    if (e.key !== "Tab" || !isDrawerOpen()) return;
    var items = focusables(sidebar());
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    var inside = sidebar().contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
  }

  function openDrawer() {
    var side = sidebar();
    if (!side || isDrawerOpen()) return;
    lastFocus = document.activeElement;
    root.dataset.drawer = "open";
    syncToggles();
    setBackgroundInert(true);
    var first = focusables(side)[0];
    if (first) first.focus();
    emit("_78:drawerchange", { open: true });
  }

  /* returnFocus defaults to true; a nav click that navigates passes false */
  function closeDrawer(returnFocus) {
    if (!isDrawerOpen()) return;
    delete root.dataset.drawer;
    setBackgroundInert(false);
    syncToggles();
    if (returnFocus !== false && lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
    emit("_78:drawerchange", { open: false });
  }
  function toggleDrawer() { isDrawerOpen() ? closeDrawer() : openDrawer(); }

  /* What the hamburger does, which depends on the width */
  function toggleNav() { isMobile() ? toggleDrawer() : toggleRail(); }

  /* --- Rail tooltip -------------------------------------------------------- */
  /* Fixed-position and parented to <body>: the sidebar is an overflow-y
     scroller, so a tooltip inside an item would be clipped. */
  var tip = null;

  function showTip(item) {
    if (!isRail() || isMobile()) return;
    var label = item.querySelector("._78-nav-label");
    if (!label) return;
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "_78-nav-tip";
      tip.setAttribute("aria-hidden", "true");   /* the label itself is the a11y name */
      document.body.appendChild(tip);
    }
    tip.textContent = label.textContent.trim();
    var r = item.getBoundingClientRect();
    /* Anchored to the RAIL's edge, not the item's: the item is inset by the
       sidebar padding, so measuring from it would tuck the tooltip back under
       the rail's own border. */
    var edge = item.closest("._78-sidebar");
    tip.style.top = Math.round(r.top + r.height / 2) + "px";
    tip.style.left = Math.round((edge ? edge.getBoundingClientRect().right : r.right) + 8) + "px";
    tip.style.transform = "translateY(-50%)";
    tip.classList.add("_78-open");
  }
  function hideTip() { if (tip) tip.classList.remove("_78-open"); }

  /* --- Active item --------------------------------------------------------- */
  function markActive(item) {
    all("._78-nav-item").forEach(function (el) {
      var on = el === item;
      el.classList.toggle("_78-active", on);
      if (on) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    return item || null;
  }

  /* The last meaningful part of a URL: no query, no hash, no trailing slash.
     "/app/orders.php?x=1" and "orders.php" both reduce to "orders.php". */
  function tail(url) {
    var u = String(url).split("?")[0].split("#")[0].replace(/\/+$/, "");
    return u.slice(u.lastIndexOf("/") + 1).toLowerCase();
  }

  /* setActive(el | "href" | "selector") — an element wins, then an href written
     exactly as the item writes it (which is how "#reports" resolves — stripping
     the hash first would leave nothing to match), then a CSS selector, then the
     last path segment, so location.pathname finds the right item. */
  function setActive(match) {
    if (!match) return null;
    if (match.nodeType === 1) return markActive(match.closest("._78-nav-item") || match);

    var want = String(match);
    var exact = null;
    all("._78-nav-item[href]").forEach(function (el) {
      if (el.getAttribute("href") === want) exact = el;
    });
    if (exact) return markActive(exact);

    var found = null;
    try { found = document.querySelector(want); } catch (e) { /* not a selector */ }
    if (found && found.closest("._78-nav-item")) return markActive(found.closest("._78-nav-item"));

    var wantTail = tail(want);
    var hit = null;
    if (wantTail) {
      all("._78-nav-item[href]").forEach(function (el) {
        if (tail(el.getAttribute("href")) === wantTail) hit = el;
      });
    }
    return hit ? markActive(hit) : null;
  }

  /* --- Dropdown menus ------------------------------------------------------ */
  function menuItems(menu) {
    return all("._78-menu-item", menu).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
  }

  function openMenu(wrap, focusFirst) {
    var m = wrap._78menu;
    if (!m || !m.menu.hidden) return;
    closeMenus(wrap);
    m.menu.hidden = false;
    m.btn.setAttribute("aria-expanded", "true");
    if (focusFirst) {
      var first = menuItems(m.menu)[0];
      if (first) first.focus();
    }
  }

  function closeMenu(wrap, returnFocus) {
    var m = wrap._78menu;
    if (!m || m.menu.hidden) return;
    m.menu.hidden = true;
    m.btn.setAttribute("aria-expanded", "false");
    if (returnFocus) m.btn.focus();
  }

  function closeMenus(except) {
    all("._78-menu-wrap").forEach(function (w) { if (w !== except) closeMenu(w); });
  }

  function mountMenu(wrap) {
    if (!wrap || wrap._78menu) return wrap ? wrap._78menu : null;
    var menu = wrap.querySelector("._78-menu");
    var btn = wrap.querySelector("[aria-haspopup]")
           || wrap.querySelector("button, a[href]");
    if (!menu || !btn || menu.contains(btn)) return null;

    if (!menu.id) menu.id = "_78-menu-" + (++seq);
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    if (btn.tagName === "BUTTON" && !btn.hasAttribute("type")) btn.type = "button";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-controls", menu.id);
    btn.setAttribute("aria-expanded", "false");

    all("._78-menu-item", menu).forEach(function (item) {
      if (!item.hasAttribute("role")) item.setAttribute("role", "menuitem");
      item.tabIndex = -1;
      if (item.tagName === "BUTTON" && !item.hasAttribute("type")) item.type = "button";
    });
    all("._78-menu-sep", menu).forEach(function (s) { s.setAttribute("role", "separator"); });

    wrap._78menu = { wrap: wrap, btn: btn, menu: menu };

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      menu.hidden ? openMenu(wrap) : closeMenu(wrap);
    });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openMenu(wrap, true);
        if (e.key === "ArrowUp") {
          var list = menuItems(menu);
          if (list.length) list[list.length - 1].focus();
        }
      }
    });

    menu.addEventListener("keydown", function (e) {
      var list = menuItems(menu);
      var i = list.indexOf(document.activeElement);
      if (e.key === "Escape") { closeMenu(wrap, true); }
      else if (e.key === "ArrowDown") { if (list.length) list[(i + 1 + list.length) % list.length].focus(); }
      else if (e.key === "ArrowUp") { if (list.length) list[(i - 1 + list.length) % list.length].focus(); }
      else if (e.key === "Home") { if (list.length) list[0].focus(); }
      else if (e.key === "End") { if (list.length) list[list.length - 1].focus(); }
      else if (e.key === "Tab") { closeMenu(wrap); return; }
      else { return; }
      e.preventDefault();
    });
    /* Choosing an item is the end of the interaction — close, like a real menu */
    menu.addEventListener("click", function (e) {
      if (e.target.closest("._78-menu-item")) closeMenu(wrap);
    });

    return wrap._78menu;
  }

  function mountMenus(scope) { return all("._78-menu-wrap", scope).map(mountMenu); }

  /* --- Wiring -------------------------------------------------------------- */
  function init() {
    /* Fallback for a page that skipped the pre-paint snippet: declaring
       [data-sidebar] is what reserves the space in the CSS. */
    if (sidebar() && !root.dataset.sidebar) {
      root.dataset.sidebar = read() === "rail" ? "rail" : "full";
    }
    syncToggles();
    mountMenus();

    all("._78-nav-toggle").forEach(function (t) {
      if (t.tagName === "BUTTON" && !t.hasAttribute("type")) t.type = "button";
      var side = sidebar();
      if (side) {
        if (!side.id) side.id = "_78-sidebar";
        t.setAttribute("aria-controls", side.id);
      }
      t.addEventListener("click", toggleNav);
    });

    all("._78-nav-collapse").forEach(function (b) {
      if (b.tagName === "BUTTON" && !b.hasAttribute("type")) b.type = "button";
      b.addEventListener("click", function () { setRail(!isRail()); });
    });

    all("._78-scrim").forEach(function (s) {
      s.addEventListener("click", function () { closeDrawer(); });
    });

    var side = sidebar();
    if (side) {
      if (!side.hasAttribute("aria-label") && !side.hasAttribute("aria-labelledby")) {
        side.setAttribute("aria-label", "Primary");
      }
      /* Following a link closes the drawer — and focus goes with the link, so
         it is deliberately not sent back to the hamburger. */
      side.addEventListener("click", function (e) {
        if (e.target.closest("._78-nav-item") && isMobile()) closeDrawer(false);
      });
      /* Rail tooltips: mouseenter/focus don't bubble, so delegate the ones that do */
      side.addEventListener("mouseover", function (e) {
        var item = e.target.closest("._78-nav-item");
        if (item) showTip(item);
      });
      side.addEventListener("focusin", function (e) {
        var item = e.target.closest("._78-nav-item");
        if (item) showTip(item);
      });
      side.addEventListener("mouseout", hideTip);
      side.addEventListener("focusout", hideTip);
      side.addEventListener("scroll", hideTip);
    }

    /* Markup that hardcodes ._78-active still needs aria-current — run it
       through the same path so the two can never disagree. Nothing marked at
       all: fall back to the current URL. */
    var marked = document.querySelector("._78-nav-item._78-active");
    if (marked) markActive(marked);
    else setActive(location.pathname);

    document.addEventListener("click", function (e) {
      if (!e.target.closest("._78-menu-wrap")) closeMenus();
    });
    document.addEventListener("keydown", trapTab);
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      closeMenus();
      closeDrawer();
    });
    /* Grown past the breakpoint: a drawer left open would be a stuck overlay */
    window.addEventListener("resize", function () {
      if (!isMobile()) closeDrawer(false);
      hideTip();
      syncToggles();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  _78.shell = {
    get rail() { return isRail(); },
    get drawer() { return isDrawerOpen(); },
    setRail: setRail,
    toggleRail: toggleRail,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    toggleDrawer: toggleDrawer,
    toggleNav: toggleNav,
    setActive: setActive,
    mountMenu: mountMenu,
    mountMenus: mountMenus,
    closeMenus: closeMenus,
    KEY: KEY,
    MOBILE: MOBILE,
    /* The exact pre-paint snippet, for docs/tooling */
    PREPAINT: "(function(){try{var s=localStorage.getItem('_78-sidebar');"
            + "document.documentElement.dataset.sidebar=s==='rail'?'rail':'full';}"
            + "catch(e){document.documentElement.dataset.sidebar='full';}})();"
  };
})(window._78);


/* ==========================================================================
   _78.toc — "On this page": a contents rail built from a page's own headings
   Scans a container's headings, builds a sticky rail of anchor links beside
   it and — where the rail has no room — the same list as a ._78-details
   dropdown, then keeps both in step with an IntersectionObserver scroll-spy
   (aria-current on the section you are reading). Fewer than two headings and
   it renders nothing at all.

     <div class="_78-toc-layout">
       <article id="doc"> <h2>…</h2> … </article>
       <aside class="_78-toc" data-toc-scope="#doc"></aside>
     </div>

   Options (or data-toc-* on the ._78-toc element):
     scope     the element (or selector) whose headings are listed
               — default: the layout's other child, else <main>, else <body>
     headings  selector run inside scope — default "h2, h3", skipping any
               heading in a <dialog>, a modal or a [data-toc-skip] subtree
     min       fewest headings worth a rail — default 2
     label     "On this page"
     inline    where the dropdown goes: an element / selector to insert it
               after, "start" (top of scope — the default) or "none"
     offset    px from the top of the viewport to the reading line's base —
               default --_78-toc-top (the topbar height when there is one)
   ========================================================================== */
(function (_78) {
  "use strict";

  var SKIP = "dialog, [role='dialog'], ._78-modal, ._78-toc, ._78-toc-inline, [data-toc-skip]";
  var smooth = function () {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function find(x, root) {
    if (!x) return null;
    return typeof x === "string" ? (root || document).querySelector(x) : x;
  }

  function slug(text, taken) {
    var base = text.toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
    var id = base, n = 2;
    while (taken[id] || document.getElementById(id)) { id = base + "-" + n++; }
    taken[id] = true;
    return id;
  }

  /* The anchor target for a heading: the <section> it opens, when it is that
     section's first heading (so a jump lands on the section's top edge),
     otherwise the heading itself. Either gets an id if it has none. */
  function targetFor(h, taken) {
    var sec = h.parentElement;
    if (sec && sec.tagName === "SECTION" && h === sec.querySelector("h1, h2, h3, h4")) {
      if (!sec.id) sec.id = slug(h.textContent, taken);
      return sec;
    }
    if (!h.id) h.id = slug(h.textContent, taken);
    return h;
  }

  function buildList(items) {
    var ul = el("ul", "_78-toc-list");
    items.forEach(function (it) {
      var li = el("li");
      var a = el("a", "_78-toc-link" + (it.level > 2 ? " _78-toc-link-sub" : ""), it.text);
      a.href = "#" + it.id;
      li.appendChild(a);
      ul.appendChild(li);
    });
    return ul;
  }

  function mount(toc, opts) {
    toc = find(toc);
    if (!toc) return null;
    if (toc._78toc) return toc._78toc;
    opts = opts || {};
    var d = toc.dataset;

    var layout = toc.closest("._78-toc-layout");
    var sibling = layout && Array.prototype.filter.call(layout.children, function (c) {
      return c !== toc;
    })[0];
    var scope = find(opts.scope || d.tocScope) || sibling ||
                document.querySelector("main") || document.body;
    var min = +(opts.min || d.tocMin || 2);
    var label = opts.label || d.tocLabel || "On this page";
    var inline = opts.inline !== undefined ? opts.inline : (d.tocInline || "start");

    var headings = Array.prototype.slice.call(
      scope.querySelectorAll(opts.headings || d.tocHeadings || "h2, h3"))
      .filter(function (h) { return !h.closest(SKIP); });

    if (headings.length < min) {           /* nothing worth a rail */
      toc.hidden = true;
      toc._78toc = { el: toc, items: [], destroy: function () {} };
      return toc._78toc;
    }
    toc.hidden = false;

    var taken = {};
    var items = headings.map(function (h) {
      var target = targetFor(h, taken);
      return {
        id: target.id,
        text: h.textContent.replace(/\s+/g, " ").trim(),
        level: +h.tagName.charAt(1) || 2,
        el: target
      };
    });

    /* Where the reading line sits: below a fixed topbar when there is one.
       --_78-toc-top is that height (see components/toc.css). */
    function top() {
      if (opts.offset != null || d.tocOffset != null) return +(opts.offset != null ? opts.offset : d.tocOffset);
      return parseFloat(getComputedStyle(toc).getPropertyValue("--_78-toc-top")) || 0;
    }

    /* A jumped-to heading parks --space-4 below that top — unless the page
       already sets its own scroll-margin-top, which wins. */
    items.forEach(function (it) {
      if (parseFloat(getComputedStyle(it.el).scrollMarginTop) === 0) {
        it.el.style.scrollMarginTop = (top() + 16) + "px";
      }
    });

    /* 1. The rail */
    toc.textContent = "";
    var nav = el("nav");
    nav.setAttribute("aria-label", label);
    nav.appendChild(el("span", "_78-toc-label", label));
    nav.appendChild(buildList(items));
    toc.appendChild(nav);

    /* 2. The same list as a dropdown, for when the rail has no room. */
    var details = null;
    if (inline !== "none" && inline !== false) {
      details = el("details", "_78-details _78-details-sm _78-toc-inline");
      var summary = el("summary", null, label);
      summary.appendChild(el("span", "_78-details-meta", items.length + " sections"));
      var body = el("div", "_78-details-body");
      var inav = el("nav");
      inav.setAttribute("aria-label", label);
      inav.appendChild(buildList(items));
      body.appendChild(inav);
      details.appendChild(summary);
      details.appendChild(body);
      var after = inline === "start" ? null : find(inline, scope) || find(inline);
      if (after && after.parentNode) after.parentNode.insertBefore(details, after.nextSibling);
      else scope.insertBefore(details, scope.firstChild);
    }

    var links = Array.prototype.slice.call(toc.querySelectorAll("._78-toc-link"))
      .concat(details ? Array.prototype.slice.call(details.querySelectorAll("._78-toc-link")) : []);

    var current = "";
    function setCurrent(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (a) {
        if (a.hash === "#" + id) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
      toc.dispatchEvent(new CustomEvent("_78:tocchange", { bubbles: true, detail: { id: id } }));
    }

    function onClick(e) {
      var a = e.target.closest && e.target.closest("._78-toc-link");
      if (!a || links.indexOf(a) === -1) return;
      var target = document.getElementById(a.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      if (details) details.open = false;    /* the dropdown has done its job */
      target.scrollIntoView({ behavior: smooth() ? "smooth" : "auto", block: "start" });
      history.replaceState(null, "", a.hash);
      setCurrent(a.hash.slice(1));
    }
    document.addEventListener("click", onClick);

    /* The current section is the LAST heading scrolled past a line just
       under the top, not the topmost one on screen — a long section
       straddling the line stays "visible" all the way down, and picking the
       topmost would leave the highlight behind for its whole length.
       The 48px tolerance is load-bearing: a jumped-to heading parks 16px
       below the top, so a tighter line would read the section you just
       clicked as not yet reached. */
    function recompute() {
      var docEl = document.documentElement;
      if (window.innerHeight + window.scrollY >= docEl.scrollHeight - 4) {
        setCurrent(items[items.length - 1].id);    /* the bottom: last entry */
        return;
      }
      var line = top() + 48, cur = items[0];
      items.forEach(function (it) {
        if (it.el.getBoundingClientRect().top <= line) cur = it;
      });
      setCurrent(cur.id);
    }

    /* The observer is the trigger, not the answer: it fires when a heading
       crosses the band, which is when the answer can change. The rAF'd
       scroll listener covers what no crossing reports — reaching the bottom,
       and content resizing under the page after load. */
    var io = "IntersectionObserver" in window
      ? new IntersectionObserver(recompute,
          { rootMargin: "-" + (top() + 16) + "px 0px -75% 0px", threshold: 0 })
      : null;
    if (io) items.forEach(function (it) { io.observe(it.el); });

    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; recompute(); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    recompute();

    /* A hash aimed at an id this module just created could not be jumped to
       on load, because the id did not exist yet. Land on it now. */
    var hashTarget = location.hash && document.getElementById(location.hash.slice(1));
    if (hashTarget && items.some(function (it) { return it.el === hashTarget; })) {
      hashTarget.scrollIntoView({ behavior: "auto", block: "start" });
      setCurrent(location.hash.slice(1));
    }

    toc._78toc = {
      el: toc,
      items: items,
      dropdown: details,
      get current() { return current; },
      setCurrent: setCurrent,
      refresh: recompute,
      destroy: function () {
        if (io) io.disconnect();
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("click", onClick);
        if (details && details.parentNode) details.parentNode.removeChild(details);
        toc.textContent = "";
        delete toc._78toc;
      }
    };
    return toc._78toc;
  }

  function mountAll(root) {
    return Array.prototype.slice
      .call((root || document).querySelectorAll("._78-toc"))
      .map(function (t) { return mount(t); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mountAll(); });
  } else {
    mountAll();
  }

  _78.toc = { mount: mount, mountAll: mountAll };
})(window._78);
