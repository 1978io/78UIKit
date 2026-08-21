# Changelog

All notable changes to 78 UI Kit are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-08-21

A component pass driven by real use: four pieces that had been hand-written in a consuming app, the
long-wanted toggle switch, and a `[hidden]` bug worth fixing on its own.

### Fixed

- **`[hidden]` is now always honored.** Any component that sets `display` (`._78-alert` and friends) beat
  the `hidden` attribute on source order, so a hidden element still rendered — a hidden alert showed as an
  empty colored bar. `reset.css` now carries `[hidden] { display: none !important }`.

### Added

- **`._78-switch`** — a toggle switch built on a real `<input type="checkbox">`, so the keyboard, focus
  ring, `:disabled` and label association are native. `-sm` size, `._78-switch-row` settings row, sizing
  through three local custom properties, light + dark.
- **`._78-seg`** — a segmented control: a joined run of buttons where exactly one is active. `_78.seg`
  mounts it as a `radiogroup` with roving tabindex, arrow / Home / End keys that step over disabled
  options, and a bubbling `_78:segchange` event. `-sm` / `-full` / `-accent` variants.
- **`._78-figure-row` / `._78-figure`** — a labeled figure trio (entry / target / stop, plan / actual /
  variance): N related numbers, each a label, a value and a tone shown as a colored left edge, using the
  existing `._78-tone-*` classes. `-sm`, `-plain` and `._78-figure-strong` variants.
- **`._78-split-bar`** — one whole divided into named, proportional segments (risk vs reward, spent vs
  remaining, pass / skip / fail), sized by `_78.viz.splitBar()` from `data-pct`. A shortfall stays as
  visible track, raw amounts over 100 are shared out, and the bar gets one `role="img"` naming every
  segment. Optional head and legend.
- **`._78-details`** — a styled disclosure: `<details>` / `<summary>` with the native marker replaced by a
  rotating CSS chevron. No JS. `-plain` / `-fill` / `-sm` variants and a `._78-details-meta` slot.
- **Color modifier aliases** — `._78-accent` / `._78-green` / `._78-warn` / `._78-red` now work anywhere,
  as aliases of the `._78-text-*` spellings.

### Changed

- **The sparkline's end-of-series dot is off by default** and opt-in with `dot: true` / `data-dot="true"`.
  It crowded a small card. *(Behavior change: a sparkline that relied on the default now draws no dot.)*
- **`._78-card-foot` is full-bleed** to the card's padding edges, like the modal foot, so an action row's
  top border reaches both sides instead of floating inset. `._78-card-foot-fill` adds the tinted surface.
- **`._78-nav` fills the sidebar height** (`flex: 1 1 auto`), so a `._78-nav-spacer` inside the optional
  `<nav>` wrapper can still push the collapse control to the bottom.

### Docs

- README, `llms.txt` and `llms-full.txt` cover every new component and option; the demo pages gained
  figure rows, split bars, the segmented control, disclosures and switches, in light and dark.
- Documented the spacing escape hatch: there is no margin utility above 16px and there are no padding
  utilities by design — use the `--space-*` tokens directly.

## [0.1.1] — 2026-08-20

Docs and copy only — no component or API changes.

### Added
- **`llms.txt` and `llms-full.txt`** — an AI-readable reference at the repo root (and on the CDN) so coding
  assistants can use the kit without scraping the docs.
- CDN install instructions and status badges in the README.

### Changed
- **Honest theming copy** — replaced the "re-theme in ~15 lines" claim (the accent tints are explicit tokens,
  so a bare `--accent` override doesn't cascade) with accurate wording across the README, tokens, demos, and
  generator; the kit is now positioned as "theme-forward."

## [0.1.0] — 2026-08-19

First public release. A vanilla, no-build UI kit you re-theme from one CSS file (or live in code) — components *and*
your third-party tables and charts recolor together, including on a live theme switch.

### Added

- **Runtime theming** — light / dark / system with a no-flash pre-paint snippet, driven by `_78.theme`;
  every change fires a `_78:themechange` event. Structure and color are separated: only color lives in the
  theme blocks, plus `-lo` tint variants and a per-theme `color-scheme`.
- **Components** — app shell (`._78-topbar` + collapse-to-rail `._78-sidebar` + mobile drawer, `_78.shell`),
  buttons, cards, KPI / stat cards, forms, badges, table, tabs, dropdown menu, and the notification set
  (modal / toast / inline alert).
- **No-library data-viz** — sparkline, progress, bar row, donut / gauge and trend, driven by `_78.viz`,
  themed through `--viz` / `--viz-lo` with no redraw on switch.
- **Library theme adapters** (opt-in, nothing vendored) — Tabulator, FullCalendar (v7 primary, v6 legacy),
  and Chart.js, each mapping the library onto kit tokens and re-theming live.
- **Theme generator** — OKLCH derivation for light and dark, WCAG AA checks, live preview, and apply / share.
- **Distribution** — MIT license, and CDN delivery via jsDelivr straight from GitHub.

### Notes

- `0.x` — the public API may change before `1.0`.

[0.2.0]: https://github.com/1978io/78UIKit/releases/tag/v0.2.0
[0.1.1]: https://github.com/1978io/78UIKit/releases/tag/v0.1.1
[0.1.0]: https://github.com/1978io/78UIKit/releases/tag/v0.1.0
