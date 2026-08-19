/* ==========================================================================
   78 UI Kit — theme generator (_78.gen)

   One color in, the whole kit token set out — for light AND dark — plus a
   live WCAG readout, an apply-to-this-page mode and a shareable ?theme= URL.
   This is the "re-theme by editing ~15 lines" pitch, automated: the generator
   writes those lines for you.

   Opt-in — NOT part of _78.js. Only demo/generator.html loads it.

   🔴 Two color rules this file exists to enforce:
   1. **Work in OKLCH.** HSL ramps go muddy — equal steps in HSL are not equal
      steps to the eye. Every derivation here moves lightness/chroma in OKLCH.
   2. **Dark is not inverted light.** A color that pops on a dark surface
      washes out on a light one, so each theme gets its own lightness and
      chroma targets, not a mirror of the other's.

   No color library, no build — all the maths is here, both directions:
   sRGB ⇄ OKLCH are fixed matrix transforms, plus a chroma-reduction gamut map
   for OKLCH values that land outside sRGB.

   ⚠️ The old "set oklch() on a hidden element and read the resolved rgb() back
   from getComputedStyle" trick **no longer converts**: since Chrome ~119 the
   computed value keeps its color space, so you get `oklch(0.62 0.19 250)`
   back verbatim. The browser is still the right parser for *user input*
   (hex, names, rgb) — resolve() below uses it for that, and understands
   whichever notation it hands back — but the OKLCH → sRGB direction is done
   here, which also makes the output identical in every browser.
   ========================================================================== */

window._78 = window._78 || {};

(function (_78) {
  "use strict";

  /* --- color plumbing ---------------------------------------------------- */

  var probeEl = null;
  var resolveCache = Object.create(null);

  function probe() {
    if (probeEl && document.documentElement.contains(probeEl)) return probeEl;
    probeEl = document.createElement("span");
    probeEl.setAttribute("aria-hidden", "true");
    probeEl.style.cssText = "position:absolute;width:0;height:0;visibility:hidden;pointer-events:none";
    document.documentElement.appendChild(probeEl);
    return probeEl;
  }

  /* Any CSS color the browser understands → {r,g,b}.
     The browser parses (hex, names, rgb, hsl, oklch…); we normalize whatever
     notation it gives back, because modern engines no longer flatten
     everything to rgb(). */
  function resolve(colour) {
    if (resolveCache[colour]) return resolveCache[colour];
    var el = probe();
    el.style.color = "";
    el.style.color = colour;
    var computed = (getComputedStyle(el).color || "").trim();
    var nums = (computed.match(/-?[\d.]+%?/g) || []).map(function (n) {
      return n.indexOf("%") > -1 ? parseFloat(n) / 100 : parseFloat(n);
    });

    var rgb;
    if (/^oklch/i.test(computed)) {
      rgb = fromOklch(nums[0], nums[1], nums[2] || 0);
    } else if (/^color\(\s*srgb/i.test(computed)) {
      rgb = { r: Math.round(nums[0] * 255), g: Math.round(nums[1] * 255), b: Math.round(nums[2] * 255) };
    } else {
      rgb = { r: Math.round(nums[0] || 0), g: Math.round(nums[1] || 0), b: Math.round(nums[2] || 0) };
    }
    resolveCache[colour] = rgb;
    return rgb;
  }

  function oklch(l, c, h) {
    return "oklch(" + round(clamp(l, 0, 1), 4) + " " + round(Math.max(0, c), 4) + " " + round(h, 2) + ")";
  }

  function fromLinear(c) {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  }

  /* OKLCH → linear sRGB (the inverse of the matrices in toOklch) */
  function oklchToLinear(L, C, H) {
    var hr = H * Math.PI / 180;
    var a = C * Math.cos(hr), b = C * Math.sin(hr);

    var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    var m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    var s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);

    return [
       4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    ];
  }

  function inGamut(linear) {
    return linear.every(function (c) { return c >= -0.0001 && c <= 1.0001; });
  }

  /* OKLCH → {r,g,b}. Out-of-gamut colors keep their lightness and hue and
     lose chroma until they fit — the same trade a designer would make, and
     far better than clipping channels (which shifts the hue). */
  function fromOklch(l, c, h) {
    l = clamp(l, 0, 1);
    c = Math.max(0, c);
    var linear = oklchToLinear(l, c, h);
    if (!inGamut(linear)) {
      var lo = 0, hi = c;
      for (var i = 0; i < 24; i++) {
        var mid = (lo + hi) / 2;
        if (inGamut(oklchToLinear(l, mid, h))) lo = mid; else hi = mid;
      }
      linear = oklchToLinear(l, lo, h);
    }
    return {
      r: clamp(Math.round(fromLinear(linear[0]) * 255), 0, 255),
      g: clamp(Math.round(fromLinear(linear[1]) * 255), 0, 255),
      b: clamp(Math.round(fromLinear(linear[2]) * 255), 0, 255)
    };
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function round(n, dp) { var f = Math.pow(10, dp == null ? 0 : dp); return Math.round(n * f) / f; }

  function toLinear(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /* sRGB → OKLCH (Björn Ottosson's matrices; plain arithmetic, no library) */
  function toOklch(rgb) {
    var R = toLinear(rgb.r), G = toLinear(rgb.g), B = toLinear(rgb.b);

    var l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    var m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    var s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);

    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var b = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

    var h = Math.atan2(b, a) * 180 / Math.PI;
    return { l: L, c: Math.sqrt(a * a + b * b), h: h < 0 ? h + 360 : h };
  }

  function hex(rgb) {
    return "#" + [rgb.r, rgb.g, rgb.b].map(function (v) {
      return clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
    }).join("");
  }

  function rgba(rgb, alpha) {
    return "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + alpha + ")";
  }

  /* --- contrast ------------------------------------------------------------ */

  function luminance(rgb) {
    return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
  }

  function contrast(a, b) {
    var l1 = luminance(a), l2 = luminance(b);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  /* alpha-composite a color over a surface — what a `-lo` tint really is */
  function over(rgb, alpha, surface) {
    return {
      r: Math.round(rgb.r * alpha + surface.r * (1 - alpha)),
      g: Math.round(rgb.g * alpha + surface.g * (1 - alpha)),
      b: Math.round(rgb.b * alpha + surface.b * (1 - alpha))
    };
  }

  /* Walk lightness until the pair reaches `need`, staying in OKLCH so hue and
     chroma survive the nudge. Returns the (possibly unchanged) color. */
  function nudge(base, against, need, dir) {
    var lch = { l: base.l, c: base.c, h: base.h };
    for (var i = 0; i < 100; i++) {
      var rgb = fromOklch(lch.l, lch.c, lch.h);
      if (contrast(rgb, against) >= need) return { lch: lch, rgb: rgb, nudged: i > 0 };
      lch.l = clamp(lch.l + dir * 0.01, 0, 1);
      if (lch.l === 0 || lch.l === 1) break;
    }
    var final = fromOklch(lch.l, lch.c, lch.h);
    return { lch: lch, rgb: final, nudged: true };
  }

  /* Nearest lightness (searching both ways from the wanted one) where the
     accent clears 3:1 on the card surface AND its best text clears 4.5:1. */
  function fitAccent(lch, surface, white, ink) {
    var fallback = null;
    for (var d = 0; d <= 0.6; d += 0.01) {
      for (var s = 0; s < (d === 0 ? 1 : 2); s++) {
        var l = clamp(lch.l + (s ? -d : d), 0, 1);
        var rgb = fromOklch(l, lch.c, lch.h);
        var onSurface = contrast(rgb, surface);
        var text = contrast(white, rgb) >= contrast(ink, rgb) ? white : ink;
        var candidate = {
          lch: { l: l, c: lch.c, h: lch.h }, rgb: rgb, text: text,
          nudged: d > 0.001, fits: true
        };
        if (onSurface >= 3 && contrast(text, rgb) >= 4.5) return candidate;
        if (!fallback && onSurface >= 3) { candidate.fits = false; fallback = candidate; }
      }
    }
    if (fallback) return fallback;
    var rgb0 = fromOklch(lch.l, lch.c, lch.h);
    return {
      lch: lch, rgb: rgb0, nudged: false, fits: false,
      text: contrast(white, rgb0) >= contrast(ink, rgb0) ? white : ink
    };
  }

  /* --- config -------------------------------------------------------------- */

  var DEFAULTS = { accent: "#0073ea", neutral: "neutral", radius: 8, density: "cozy" };

  /* Neutral tint: grays are never truly gray in a good UI — they lean.
     A tiny chroma at a chosen hue is the whole difference. */
  var NEUTRALS = {
    neutral: { h: 0, c: 0 },
    cool: { h: 250, c: 0.014 },
    warm: { h: 70, c: 0.014 },
    accent: { h: null, c: 0.010 }          /* h filled from the accent */
  };

  /* Conventional semantic hues. A "themed red that isn't red" is a usability
     trap, so these never follow the accent — only their L/C adapt per theme. */
  var SEMANTIC = { success: 150, warn: 75, danger: 27, info: 240 };

  var DENSITY = {
    compact:     { scale: 0.75, control: 32, controlSm: 26, icon: 28 },
    cozy:        { scale: 1,    control: 36, controlSm: 28, icon: 32 },
    comfortable: { scale: 1.25, control: 40, controlSm: 32, icon: 36 }
  };

  /* Per-theme targets — this is where "dark ≠ inverted light" lives.
     Note the surfaces: light stacks bg (dimmest) → bg2 (white); dark stacks
     bg (darkest) → bg2 → bg3 getting *lighter* as they get closer to you. */
  var THEMES = {
    light: {
      bg: 0.962, bg2: 1, bg3: 0.978, border: 0.905, rowBorder: 0.945,
      text: 0.245, dim: 0.575,
      accentL: [0.45, 0.62], accentChroma: 1,
      semanticL: 0.52, semanticC: 0.14,
      tint: 0.10, rowHover: 0.035, shadow: 0.08, shadowLg: 0.12, overlay: 0.45,
      ring: 0.25, glow: "0 2px 8px", glowAlpha: 0.25
    },
    dark: {
      bg: 0.175, bg2: 0.245, bg3: 0.295, border: 0.34, rowBorder: 0.285,
      text: 0.915, dim: 0.63,
      accentL: [0.66, 0.80], accentChroma: 0.85,   /* less saturated on dark */
      semanticL: 0.82, semanticC: 0.16,
      tint: 0.16, rowHover: 0.04, shadow: 0.40, shadowLg: 0.50, overlay: 0.60,
      ring: 0.35, glow: "0 2px 10px", glowAlpha: 0.30
    }
  };

  function normalise(config) {
    var c = Object.assign({}, DEFAULTS, config || {});
    c.accent = /^#?[0-9a-f]{3,8}$/i.test(String(c.accent).trim())
      ? (String(c.accent).trim()[0] === "#" ? c.accent.trim() : "#" + c.accent.trim())
      : DEFAULTS.accent;
    if (!NEUTRALS[c.neutral]) c.neutral = DEFAULTS.neutral;
    if (!DENSITY[c.density]) c.density = DEFAULTS.density;
    c.radius = clamp(parseInt(c.radius, 10) || 0, 0, 20);
    return c;
  }

  /* --- derivation ---------------------------------------------------------- */

  function deriveTheme(mode, accentLch, neutral, notes) {
    var t = THEMES[mode];
    var dir = mode === "light" ? -1 : 1;          /* which way is "more contrast" */
    var n = { h: neutral.h, c: neutral.c };
    /* A tint has to fade as a gray approaches black or white, or near-white
       surfaces read as "pale blue" rather than "cool gray". */
    var tintAt = function (l) { return n.c * (1 - 0.65 * Math.abs(2 * l - 1)); };
    var grey = function (l, chroma) { return fromOklch(l, chroma == null ? tintAt(l) : chroma, n.h); };

    var bg = grey(t.bg);
    var bg2 = grey(t.bg2, t.bg2 >= 1 ? 0 : n.c);  /* pure white stays pure white */
    var bg3 = grey(t.bg3);
    var border = grey(t.border);
    var rowBorder = grey(t.rowBorder);

    /* Text + dim, nudged until they clear AA on the busiest surface (bg2) */
    var text = nudge({ l: t.text, c: n.c, h: n.h }, bg2, 4.5, dir);
    var dim = nudge({ l: t.dim, c: n.c, h: n.h }, bg2, 4.5, dir);
    if (text.nudged) notes.push(mode + ": --text lightness nudged for AA on --bg2");
    if (dim.nudged) notes.push(mode + ": --dim lightness nudged for AA on --bg2");

    /* Accent: keep the hue, retarget lightness for the theme, then satisfy
       BOTH constraints at once — it has to stand off the card surface (3:1,
       large-UI) *and* carry readable text on a fill (4.5:1). Those pull in
       opposite directions, so search outward from the wanted lightness for
       the nearest value that clears both, rather than fixing one and
       breaking the other. */
    var white = { r: 255, g: 255, b: 255 };
    var ink = fromOklch(0.16, n.c, n.h);
    var accent = fitAccent(
      { l: clamp(accentLch.l, t.accentL[0], t.accentL[1]), c: accentLch.c * t.accentChroma, h: accentLch.h },
      bg2, white, ink
    );
    if (accent.nudged) {
      notes.push(mode + ": --accent lightness moved to clear 3:1 on --bg2 and 4.5:1 for --accent-text");
    }
    if (!accent.fits) {
      notes.push(mode + ": no lightness of this hue clears both accent checks — the closest was kept");
    }
    var accentText = accent.text;

    var hoverL = clamp(accent.lch.l + (mode === "light" ? -0.07 : 0.06), 0, 1);
    var accentHover = fromOklch(hoverL, accent.lch.c, accent.lch.h);

    var tokens = {};
    tokens["--bg"] = hex(bg);
    tokens["--bg2"] = hex(bg2);
    tokens["--bg3"] = hex(bg3);
    tokens["--border"] = hex(border);
    tokens["--shadow"] = mode === "light"
      ? "0 1px 3px " + rgba(text.rgb, t.shadow)
      : "0 2px 8px rgba(0, 0, 0, " + t.shadow + ")";
    tokens["--shadow-lg"] = mode === "light"
      ? "0 8px 24px " + rgba(text.rgb, t.shadowLg)
      : "0 8px 24px rgba(0, 0, 0, " + t.shadowLg + ")";
    tokens["--text"] = hex(text.rgb);
    tokens["--dim"] = hex(dim.rgb);
    tokens["--accent"] = hex(accent.rgb);
    tokens["--accent-text"] = hex(accentText);
    tokens["--accent-hover"] = hex(accentHover);
    tokens["--accent-lo"] = rgba(accent.rgb, t.tint);
    tokens["--accent-lo-hover"] = rgba(accent.rgb, round(t.tint + 0.08, 2));
    tokens["--accent-glow"] = t.glow + " " + rgba(accent.rgb, t.glowAlpha);

    /* Semantics: fixed hues, per-theme lightness, each nudged until its own
       text reads on its own tint (that pairing is what the kit uses). */
    Object.keys(SEMANTIC).forEach(function (name) {
      var h = SEMANTIC[name];
      var lch = { l: t.semanticL, c: t.semanticC, h: h };
      var rgb = fromOklch(lch.l, lch.c, lch.h);
      for (var i = 0; i < 60; i++) {
        var tint = over(rgb, t.tint, bg2);
        if (contrast(rgb, tint) >= 4.5) break;
        lch.l = clamp(lch.l + dir * 0.01, 0, 1);
        rgb = fromOklch(lch.l, lch.c, lch.h);
        if (i === 59) notes.push(mode + ": --" + name + " could not reach AA on its own tint");
      }
      tokens["--" + name] = hex(rgb);
      tokens["--" + name + "-lo"] = rgba(rgb, t.tint);
    });

    tokens["--row-hover"] = mode === "light"
      ? rgba(text.rgb, t.rowHover)
      : "rgba(255, 255, 255, " + t.rowHover + ")";
    tokens["--row-border"] = hex(rowBorder);
    tokens["--row-selected"] = "var(--accent-lo)";
    tokens["--overlay"] = mode === "light"
      ? rgba(text.rgb, t.overlay)
      : "rgba(0, 0, 0, " + t.overlay + ")";
    tokens["--ring"] = rgba(accent.rgb, t.ring);

    return tokens;
  }

  function deriveBase(config) {
    var d = DENSITY[config.density];
    var r = config.radius;
    var step = function (n) { return Math.max(1, Math.round(n * d.scale)) + "px"; };
    return {
      "--radius-sm": Math.max(0, Math.round(r * 0.75)) + "px",
      "--radius": r + "px",
      "--radius-lg": Math.round(r * 1.25) + "px",
      "--space-1": step(4), "--space-2": step(8), "--space-3": step(12),
      "--space-4": step(16), "--space-5": step(24), "--space-6": step(32),
      "--control-h": d.control + "px",
      "--control-h-sm": d.controlSm + "px",
      "--icon-btn-size": d.icon + "px"
    };
  }

  /* The whole job: config in, both token sets + notes out. */
  function derive(config) {
    config = normalise(config);
    var accentLch = toOklch(resolve(config.accent));
    var neutral = Object.assign({}, NEUTRALS[config.neutral]);
    if (neutral.h == null) neutral.h = accentLch.h;
    var notes = [];

    return {
      config: config,
      accent: accentLch,
      light: deriveTheme("light", accentLch, neutral, notes),
      dark: deriveTheme("dark", accentLch, neutral, notes),
      base: deriveBase(config),
      notes: notes
    };
  }

  /* --- contrast report ------------------------------------------------------ */

  /* The pairs that actually decide whether a theme is usable. */
  function report(tokens, mode) {
    var t = THEMES[mode];
    var col = function (name) { return resolve(tokens[name]); };
    var rows = [
      { label: "--text on --bg", a: col("--text"), b: col("--bg"), need: 4.5 },
      { label: "--text on --bg2", a: col("--text"), b: col("--bg2"), need: 4.5 },
      { label: "--text on --bg3", a: col("--text"), b: col("--bg3"), need: 4.5 },
      { label: "--dim on --bg2", a: col("--dim"), b: col("--bg2"), need: 4.5 },
      { label: "--accent-text on --accent", a: col("--accent-text"), b: col("--accent"), need: 4.5 },
      { label: "--accent on --bg2", a: col("--accent"), b: col("--bg2"), need: 3, large: true },
      /* advisory, not WCAG: an edge you cannot see is a border that is not doing its job */
      { label: "--border on --bg2", a: col("--border"), b: col("--bg2"), need: 1.25, large: true, soft: true }
    ];
    Object.keys(SEMANTIC).forEach(function (name) {
      rows.push({
        label: "--" + name + " on --" + name + "-lo",
        a: col("--" + name),
        b: over(col("--" + name), t.tint, col("--bg2")),
        need: 4.5
      });
    });
    return rows.map(function (row) {
      var ratio = contrast(row.a, row.b);
      return {
        label: row.label,
        ratio: round(ratio, 2),
        need: row.need,
        large: !!row.large,
        soft: !!row.soft,
        pass: ratio >= row.need
      };
    });
  }

  /* --- output --------------------------------------------------------------- */

  var GROUPS = [
    ["Surfaces", ["--bg", "--bg2", "--bg3", "--border", "--shadow", "--shadow-lg"]],
    ["Text", ["--text", "--dim"]],
    ["Accent", ["--accent", "--accent-text", "--accent-hover", "--accent-lo", "--accent-lo-hover", "--accent-glow"]],
    ["Semantic", ["--success", "--success-lo", "--warn", "--warn-lo", "--danger", "--danger-lo", "--info", "--info-lo"]],
    ["Rows, overlay, focus", ["--row-hover", "--row-border", "--row-selected", "--overlay", "--ring"]]
  ];

  function block(selector, tokens, grouped) {
    var lines = [selector + " {"];
    if (grouped) {
      GROUPS.forEach(function (group, i) {
        if (i) lines.push("");
        lines.push("  /* " + group[0] + " */");
        group[1].forEach(function (name) {
          if (tokens[name] != null) lines.push("  " + name + ": " + tokens[name] + ";");
        });
      });
    } else {
      Object.keys(tokens).forEach(function (name) {
        lines.push("  " + name + ": " + tokens[name] + ";");
      });
    }
    lines.push("}");
    return lines.join("\n");
  }

  /* Paste-ready CSS: drop it in a <style> AFTER kit.css and the whole kit
     follows — components, adapters and all. */
  function css(result, opts) {
    opts = opts || {};
    var parts = [
      "/* 78 UI Kit theme — generated from " + result.config.accent +
      " (" + result.config.neutral + " neutral, " + result.config.radius + "px radius, " +
      result.config.density + ") */",
      "/* Paste after kit.css. Nothing else changes. */",
      "",
      block(':root[data-theme="dark"]', result.dark, true),
      "",
      block(':root[data-theme="light"]', result.light, true)
    ];
    if (opts.base !== false) {
      parts.push("", "/* Shape + density (not color — these live in the shared :root) */",
                 block(":root", result.base, false));
    }
    return parts.join("\n");
  }

  /* --- apply / persist / share ---------------------------------------------- */

  var STORAGE = "_78-gen";                 /* config; the kit's own key is _78-theme */
  var STYLE_ID = "_78-gen-style";

  function styleEl() {
    var el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    return el;
  }

  /* Applied as a real stylesheet (not inline props) so BOTH theme blocks are
     present and the kit's own toggle keeps working. */
  function apply(result) {
    var text = css(result, { base: true });
    styleEl().textContent = text;
    /* the CSS is stored alongside the config so the pre-paint snippet can put
       it back before first paint without re-deriving anything */
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ config: result.config, css: text }));
    } catch (e) { /* no-op */ }
    document.documentElement.dataset._78Gen = "on";
    document.dispatchEvent(new CustomEvent("_78:genchange", { detail: { config: result.config } }));
    return result;
  }

  function clear() {
    var el = document.getElementById(STYLE_ID);
    if (el) el.remove();
    try { localStorage.removeItem(STORAGE); } catch (e) { /* no-op */ }
    delete document.documentElement.dataset._78Gen;
    document.dispatchEvent(new CustomEvent("_78:genchange", { detail: { config: null } }));
  }

  function stored() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
      return saved && saved.config ? saved.config : null;
    } catch (e) { return null; }
  }

  /* Preview: write one theme's tokens onto a container as inline custom
     properties, so a panel can show light while the page is dark. */
  function preview(el, tokens, base) {
    if (!el) return el;
    Object.keys(tokens).forEach(function (name) { el.style.setProperty(name, tokens[name]); });
    if (base) Object.keys(base).forEach(function (name) { el.style.setProperty(name, base[name]); });
    return el;
  }

  /* ?theme=0073ea.cool.8.cozy — short, readable, no backend */
  function encode(config) {
    config = normalise(config);
    return [config.accent.replace("#", ""), config.neutral, config.radius, config.density].join(".");
  }

  function decode(value) {
    if (!value) return null;
    var bits = String(value).split(".");
    if (!bits[0]) return null;
    return normalise({ accent: bits[0], neutral: bits[1], radius: bits[2], density: bits[3] });
  }

  function fromUrl(search) {
    var params = new URLSearchParams(search != null ? search : window.location.search);
    return decode(params.get("theme"));
  }

  function shareUrl(config, base) {
    var url = new URL(base || window.location.href);
    url.searchParams.set("theme", encode(config));
    return url.toString();
  }

  _78.gen = {
    /* color maths */
    resolve: resolve, toOklch: toOklch, fromOklch: fromOklch, oklch: oklch,
    hex: hex, rgba: rgba, contrast: contrast, luminance: luminance, over: over,
    /* the job */
    derive: derive, report: report, css: css, block: block,
    /* page */
    apply: apply, clear: clear, stored: stored, preview: preview,
    /* sharing */
    encode: encode, decode: decode, fromUrl: fromUrl, shareUrl: shareUrl,
    DEFAULTS: DEFAULTS, STORAGE: STORAGE,
    /* Pre-paint snippet — put the saved theme back BEFORE first paint, with
       no re-derivation. Runs after _78.theme's snippet, before any stylesheet. */
    PREPAINT: "(function(){try{var s=JSON.parse(localStorage.getItem('_78-gen')||'null');if(!s||!s.css)return;"
            + "var e=document.createElement('style');e.id='_78-gen-style';e.textContent=s.css;"
            + "document.documentElement.appendChild(e);document.documentElement.dataset._78Gen='on';}catch(e){}})();"
  };
})(window._78);
