# Design reference

Everything in `stitch/` was generated with [Stitch](https://stitch.withgoogle.com), Google's
design tool. It is a **reference for structure, fields and copy — not production code**. Do not
paste `code.html` into the app: those files are standalone Tailwind pages built against a CDN
build of Tailwind, with their own inline config and Material Symbols icons, none of which match
how this app is actually built.

Build the real screen by hand, using the design tokens already in the app (see below), and use
the mockup to decide what goes where.

## What's in here

Each folder is one screen, with:

- `screen.png` — a rendered preview. Usually the fastest way to see what's intended.
- `code.html` — the static mockup. Useful for reading exact spacing, field order and Romanian
  copy; not useful as code.

Three folders are not screens:

| Folder | What it is |
| --- | --- |
| `civic_pulse_chisinau/` | **`DESIGN.md` lives here** — the design system |
| `aici_civic_emblem/` | A logo concept. Never adopted; the app uses a plain text wordmark |
| `authentic_documentary_close_up_photograph_of_a_damaged_asphalt_street_with_an/` | An AI-generated stock photo used as filler inside other mockups |

For which mockup folder maps to which page file in this repo, see **[`../SCREENS.md`](../SCREENS.md)**.

## Variants — pick one, don't build them all

Several screens exist in multiple versions. They are alternative directions for the *same*
screen, not separate screens:

- **Dark mode** — any folder ending `_dark_mode`. The app already supports dark mode
  (see below), so these are the reference for what a screen looks like with the theme toggled,
  not a separate page to build.
- **Desktop** — any folder ending `_desktop`. Wider-viewport version of the same screen.
- **Named variants** — two screens have competing layout directions:
  - `create_account` → `_stepper_civic_trust_`, `_editorial_civic_impact_`,
    `_minimal_registry_fast_access_` (plus the unsuffixed default)
  - `my_account_citizen` → `_command_hub_`, `_editorial_stream_`, `_tabular_registry_`
    (plus the unsuffixed default)

  Same data, same route, different framing. **Which one to build is still an open decision** —
  check with Andrei before picking.

## Source of truth for colors, type and spacing

`stitch/civic_pulse_chisinau/DESIGN.md` — colors, typography scale, spacing, elevation, shape
and per-component specs.

**You should not need to read it to get the values.** Everything in its YAML front-matter is
already implemented in the app:

- `tailwind.config.ts` — the tokens as Tailwind classes (`bg-surface`, `text-on-surface`,
  `rounded-xl`, `p-space-lg`, `font-headline-lg`, …)
- `src/app/globals.css` — the same tokens as CSS variables, with a dark value for each
- `src/ui/themed-styles.ts` — shared input/button/label/link classes built from those tokens

So: use `bg-surface-container-lowest`, never `bg-[#ffffff]`. Never eyeball a hex off a
screenshot.

### Known discrepancy in DESIGN.md

`DESIGN.md` describes the palette **twice, and the two don't agree**:

1. The **YAML front-matter** at the top — Material-3 style role tokens, `primary: #00685f`,
   `surface: #faf8ff`, etc.
2. A prose **"Brand Scale"** section further down — a different teal, `brand-600: #0d9488`.

Every `code.html` in this folder uses the **YAML tokens**. The prose "Brand Scale" values don't
appear in any mockup — they happen to match the app's *old* pre-redesign palette, which has
since been removed.

**The app implements the YAML tokens.** The prose section is stale and should be deleted from
`DESIGN.md` once someone confirms that's intended.

## A note on fabricated content in the mockups

Several mockups display data this app does not have and does not collect. When building a
screen, leave these out rather than inventing a backend for them:

- A "civic score" / "Nivel 3" gamification badge — no scoring rule exists anywhere
- A citizen ID like `ID-8821` — citizens have an internal UUID, never shown to them
- Ticket codes like `#AIC-8492`, `#LM-9022` — reports are identified by a real UUID, shown
  truncated (e.g. `a4f9c21b`)
- Named contractors ("Î.M. Regia «Lumteh»", "Exdrupo"), a dispatcher hotline number, "SMS"
  notifications, and "SLA: 48 ore" countdowns — none of these integrations exist. The real
  deadline is **30 calendar days** (Administrative Code art. 60), already implemented in
  `src/features/reports/deadline.ts`
- Sector filters (Centru / Botanica / Rîșcani …) — reports store coordinates, not a sector

The already-rebuilt sign-up page (`src/app/(citizen)/sign-up/page.tsx`) shows the approach:
it keeps the mockup's two-column layout but replaces the invented statistics with three things
the app genuinely does.
