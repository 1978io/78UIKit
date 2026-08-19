/* ==========================================================================
   78 UI Kit — Chart.js theme adapter
   Target: Chart.js 4.x (verified against 4.5.1). MIT, not vendored.

   Opt-in. Include AFTER Chart.js and after _78.js:

     <script src="…/chart.js@4/dist/chart.umd.js"></script>
     <script src="/78UIKit/js/_78.js"></script>
     <script src="/78UIKit/js/adapters/chartjs.js"></script>

   🔴 Why this one is JS and the others are CSS: a chart is a <canvas>. Canvas
   pixels can't resolve `var(--accent)` — the colors are baked in at draw
   time. So the adapter reads the kit tokens with getComputedStyle, pushes
   them into Chart.defaults, and — the bit everyone misses — re-applies and
   `update()`s every live chart on `_78:themechange`, because Chart.defaults
   is only read when a chart is CONSTRUCTED.

   API:
     _78.adapters.chartjs.apply()      re-read tokens, restyle, update charts
     _78.adapters.chartjs.palette(n)   n theme-derived series colors
     _78.adapters.chartjs.tokens()     the token values currently in force
     _78.adapters.chartjs.alpha(c, a)  any CSS color → rgba() at alpha a

   Datasets: a dataset that declares no colors of its own is adopted by the
   adapter and recolored on every theme switch. A dataset that declares
   `backgroundColor`/`borderColor` is left alone, forever — your explicit
   color always wins.
   ========================================================================== */

window._78 = window._78 || {};

(function (_78) {
  "use strict";

  var root = document.documentElement;

  /* --- token plumbing ----------------------------------------------------- */

  function token(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name);
    v = v ? v.trim() : "";
    return v || fallback || "";
  }

  function px(name, fallback) {
    var n = parseFloat(token(name));
    return isNaN(n) ? fallback : n;
  }

  /* The tokens this adapter cares about, resolved for the current theme. */
  function tokens() {
    return {
      text: token("--text", "#1a1d23"),
      dim: token("--dim", "#6b7280"),
      border: token("--border", "#e2e6ed"),
      bg2: token("--bg2", "#ffffff"),
      bg3: token("--bg3", "#f7f8fa"),
      accent: token("--accent", "#0073ea"),
      success: token("--success", "#15803d"),
      warn: token("--warn", "#b45309"),
      danger: token("--danger", "#dc2626"),
      info: token("--info", "#0369a1"),
      font: token("--font", "sans-serif"),
      fontSize: px("--fs-sm", 12),
      radius: px("--radius-sm", 6)
    };
  }

  /* --- color helper ------------------------------------------------------
     Canvas needs a concrete rgba() — this is the `-lo` tint idea in JS.
     Handles #rgb / #rrggbb / #rrggbbaa / rgb() / rgba(); anything else is
     returned untouched rather than mangled.
     ---------------------------------------------------------------------- */
  function alpha(color, a) {
    if (!color) return color;
    var c = String(color).trim(), m;

    if (c.charAt(0) === "#") {
      var hex = c.slice(1);
      if (hex.length === 3 || hex.length === 4) {
        hex = hex.split("").map(function (h) { return h + h; }).join("");
      }
      if (hex.length !== 6 && hex.length !== 8) return c;
      var n = parseInt(hex.slice(0, 6), 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }

    m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (m) return "rgba(" + m[1] + "," + m[2] + "," + m[3] + "," + a + ")";

    return c;
  }

  /* --- palette ------------------------------------------------------------
     Series colors derived from the theme: accent first (it's the project's
     own color), then the semantic tokens. Past the base set the ramp repeats
     at lower opacity rather than inventing hues that no token defines.
     ---------------------------------------------------------------------- */
  function palette(n) {
    var t = tokens();
    var base = [t.accent, t.success, t.warn, t.danger, t.info, t.dim];
    var fades = [1, .65, .4];
    var out = [];
    var count = typeof n === "number" && n > 0 ? n : base.length;

    for (var i = 0; i < count; i++) {
      var color = base[i % base.length];
      var fade = fades[Math.min(Math.floor(i / base.length), fades.length - 1)];
      out.push(fade === 1 ? color : alpha(color, fade));
    }
    return out;
  }

  /* --- Chart.defaults ----------------------------------------------------- */

  function applyDefaults(Chart) {
    var t = tokens();
    var d = Chart.defaults;

    d.font.family = t.font;
    d.font.size = t.fontSize;
    d.color = t.text;                       /* base text (legend, datalabels) */
    d.borderColor = t.border;               /* dataset-level default border   */

    /* Scales — ticks read dim, grid + axis line read border */
    if (d.scale) {
      d.scale.ticks = d.scale.ticks || {};
      d.scale.ticks.color = t.dim;
      d.scale.grid = d.scale.grid || {};
      d.scale.grid.color = t.border;
      d.scale.grid.tickColor = t.border;
      d.scale.border = d.scale.border || {};
      d.scale.border.color = t.border;
      d.scale.title = d.scale.title || {};
      d.scale.title.color = t.dim;
    }

    /* Legend + title */
    d.plugins.legend.labels.color = t.text;
    d.plugins.legend.labels.usePointStyle = true;
    d.plugins.legend.labels.boxWidth = 8;
    d.plugins.legend.labels.boxHeight = 8;
    d.plugins.title.color = t.text;
    d.plugins.subtitle.color = t.dim;

    /* Tooltip — a kit card, drawn on canvas */
    d.plugins.tooltip.backgroundColor = t.bg2;
    d.plugins.tooltip.titleColor = t.text;
    d.plugins.tooltip.bodyColor = t.text;
    d.plugins.tooltip.footerColor = t.dim;
    d.plugins.tooltip.borderColor = t.border;
    d.plugins.tooltip.borderWidth = 1;
    d.plugins.tooltip.cornerRadius = t.radius;
    d.plugins.tooltip.padding = 8;
    d.plugins.tooltip.usePointStyle = true;
    d.plugins.tooltip.boxPadding = 4;

    /* Elements — arc borders separate segments against the card surface */
    d.elements.arc.borderColor = t.bg2;
    d.elements.arc.borderWidth = 2;
    d.elements.line.borderWidth = 2;
    d.elements.point.borderColor = t.bg2;
    d.elements.point.hoverBorderColor = t.bg2;
    d.elements.bar.borderWidth = 0;

    /* Chart.js 4 ships its own auto-color plugin — ours replaces it */
    if (d.plugins.colors) d.plugins.colors.enabled = false;
  }

  /* --- dataset coloring --------------------------------------------------
     Runs on every chart update, so a theme switch recolors adopted datasets.
     ---------------------------------------------------------------------- */

  function adopts(ds) {
    if (ds.$_78 === true) return true;                 /* already ours       */
    if (ds.$_78 === false) return false;               /* explicitly theirs  */
    ds.$_78 = ds.backgroundColor === undefined && ds.borderColor === undefined;
    return ds.$_78;
  }

  function styleDataset(ds, type, index, colors, t) {
    var color = colors[index % colors.length];

    if (type === "line" || type === "radar") {
      ds.borderColor = color;
      ds.backgroundColor = alpha(color, .16);
      ds.pointBackgroundColor = color;
      ds.pointBorderColor = t.bg2;
      ds.pointHoverBackgroundColor = color;
      return;
    }

    if (type === "pie" || type === "doughnut" || type === "polarArea") {
      var points = (ds.data && ds.data.length) || 0;
      var perPoint = palette(points);
      ds.backgroundColor = type === "polarArea"
        ? perPoint.map(function (c) { return alpha(c, .7); })
        : perPoint;
      ds.borderColor = t.bg2;
      return;
    }

    /* bar, bubble, scatter, everything else */
    ds.backgroundColor = color;
    ds.borderColor = color;
    ds.hoverBackgroundColor = alpha(color, .8);
  }

  var palettePlugin = {
    id: "_78palette",
    beforeUpdate: function (chart) {
      var datasets = (chart.data && chart.data.datasets) || [];
      var colors = palette(datasets.length);
      var t = tokens();
      datasets.forEach(function (ds, i) {
        if (!adopts(ds)) return;
        styleDataset(ds, ds.type || chart.config.type, i, colors, t);
      });
    }
  };

  /* --- live charts --------------------------------------------------------
     Chart.instances is a plain id → chart map in Chart.js 3/4.
     ---------------------------------------------------------------------- */
  function liveCharts(Chart) {
    var reg = Chart.instances || {};
    return Object.keys(reg).map(function (k) { return reg[k]; }).filter(Boolean);
  }

  /* --- apply --------------------------------------------------------------- */

  var registered = false;

  function apply() {
    var Chart = window.Chart;
    if (!Chart) return false;                 /* include this after Chart.js */

    if (!registered) {
      Chart.register(palettePlugin);
      registered = true;
    }

    applyDefaults(Chart);

    liveCharts(Chart).forEach(function (chart) {
      try {
        chart.update("none");                 /* re-theme without re-animating */
      } catch (e) { /* a chart mid-teardown must not break the theme switch */ }
    });

    return true;
  }

  /* --- wiring -------------------------------------------------------------- */

  document.addEventListener("_78:themechange", apply);

  /* Apply straight away when Chart.js is already there (the documented order),
     so charts are CONSTRUCTED with themed defaults rather than corrected after.
     Retry on DOMContentLoaded for pages that load Chart.js later. */
  if (!apply() && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  }

  _78.adapters = _78.adapters || {};
  _78.adapters.chartjs = {
    apply: apply,
    palette: palette,
    tokens: tokens,
    alpha: alpha,
    plugin: palettePlugin
  };
})(window._78);
