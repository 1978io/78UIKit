/* ==========================================================================
   78 UI Kit — _78.js
   One global (`_78`), no dependencies, no build step.

   Surface: _78.theme · _78.modal · _78.notify · _78.tabs

   ⭐ Which notification? — the rule, so nobody has to guess:
      MODAL  needs acknowledgement (errors, confirms) — blocks, requires a click
             _78.modal.open({title, body, actions}) → Promise<action value|null>
             _78.modal.confirm(msg) → Promise<boolean> · _78.modal.alert(msg)
      TOAST  informational ("Saved", "Copied")        — auto-dismisses, never blocks
             _78.notify(msg, {type, duration}) · .success/.error/.warn/.info
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

  /* Backdrop click to dismiss. Safe to call twice on the same dialog. */
  function mount(dialog) {
    if (!dialog || dialog.dataset._78ModalMounted) return dialog;
    dialog.dataset._78ModalMounted = "1";
    dialog.classList.add("_78-modal");

    dialog.addEventListener("click", function (e) {
      /* the backdrop IS the dialog element — its children cover the box */
      if (e.target === dialog && dialog.dataset._78Dismissible !== "false") dialog.close("");
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
    if (opts.tone) dialog.classList.add("_78-modal-" + opts.tone);
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

  function confirm(message, opts) {
    opts = opts || {};
    return open({
      title: opts.title || "Are you sure?",
      body: message,
      html: opts.html,
      size: opts.size || "sm",
      tone: opts.tone,
      actions: [
        { label: opts.cancelLabel || "Cancel", value: false, variant: "ghost" },
        { label: opts.confirmLabel || "Confirm", value: true,
          variant: opts.tone === "danger" ? "danger" : "primary", autofocus: true }
      ]
    }).then(function (value) { return value === true; });
  }

  function alert(message, opts) {
    opts = opts || {};
    return open({
      title: opts.title || "Heads up",
      body: message,
      html: opts.html,
      size: opts.size || "sm",
      tone: opts.tone,
      actions: [{ label: opts.okLabel || "OK", value: true, variant: "primary", autofocus: true }]
    }).then(function () { return undefined; });
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
    var type = opts.type || "default";
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

  ["success", "error", "warn", "info"].forEach(function (type) {
    notify[type] = function (message, opts) {
      opts = opts || {};
      opts.type = type;
      return notify(message, opts);
    };
  });

  _78.notify = notify;

  /* Inline alerts are pure CSS — the one behaviour they have is dismissal. */
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
