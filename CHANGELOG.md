# Changelog

All notable changes to 78 UI Kit are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

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

[0.1.0]: https://github.com/1978io/78UIKit/releases/tag/v0.1.0
