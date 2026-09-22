---
name: Civic Pulse Chisinau
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#924628'
  on-tertiary: '#ffffff'
  tertiary-container: '#b05e3d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#773215'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system establishes a high-trust, responsive civic infrastructure interface designed for the municipality of Chisinau. The aesthetic merges the clarity and permanence of modern public utility design with the operational density required by municipal municipal dispatchers and field inspectors.

### Core Tenets
- **Civic Trust over Tech Hype:** No generic startup gradients, frivolous decorative blurs, or patronizing cartoon illustrations. Visual weight is carried by crisp borders, immaculate typographic scale, and authentic real-world map data.
- **Bifurcated Ergonomics:** 
  - *Citizen View:* Calm, step-guided, generous touch targets (minimum 44×44px), humanized micro-copy, and low cognitive friction during stressful local situations (e.g., burst pipes, hazardous roads).
  - *Staff View:* High-density tabular views, immediate visual scanning of service level agreements (SLAs), distinct status-coded markers, and monospace tracking codes.
- **Cartographic Primacy:** The map is an active civic workspace, rendered in full natural color rather than desaturated novelty themes, ensuring landmarks and street geometry remain immediately recognizable to local residents.

## Colors

The palette is rooted in an institutional deep teal, paired with a cool slate neutral scale to convey authority, precision, and civic cleanliness. The color strategy enforces WCAG 2.1 AA compliance across all foreground-to-background combinations.

### Brand Scale
- **brand-50 (`#f0fdfa`):** Interactive element fills, resolved pill backgrounds, input focus halos.
- **brand-100 (`#ccfbf1`):** Active navigation items, subtle callout surfaces.
- **brand-500 (`#14b8a6`):** Resolved pin fills, decorative accents, secondary indicators.
- **brand-600 (`#0d9488`):** Primary action buttons, primary interactive icons.
- **brand-700 (`#0f766e`):** Primary button hover states, in-text active links, text on brand-50.
- **brand-800 (`#115e59`):** Button active/pressed states, high-contrast key headers.

### Neutral Slate Scale
- **Canvas Base (`#f8fafc`):** Application viewport background.
- **Card / Surface (`#ffffff`):** Modals, inputs, table rows, cards.
- **Subtle Surface (`#f1f5f9`):** Table headers, inactive pill backgrounds.
- **Border Default (`#e2e8f0`):** Input boundaries, card divisions, hairline grid rules.
- **Border Strong (`#cbd5e1`):** Interactive form controls resting borders, pin outlines.
- **Text Secondary (`#475569`):** Supporting metadata, form help labels, table headers.
- **Text Primary (`#0f172a`):** Primary headings, core body copy, high-priority counts.

### Issue Lifecycle & Pin Semantics
Status tokens carry dedicated container fills, high-contrast text values, and pin fills:
- **New:** Status Fill `#ef4444`, Text `#b91c1c`, Container `#fef2f2`. Denotes urgent, unassigned incoming submissions.
- **In Progress:** Status Fill `#f59e0b`, Text `#b45309`, Container `#fffbeb`. Applied during agency dispatch and active remediation.
- **Resolved:** Status Fill `#14b8a6`, Text `#0f766e`, Container `#f0fdfa`. Confirmed civic fix with closure audit.
- **Rejected:** Status Fill `#64748b`, Text `#475569`, Container `#f1f5f9`. Out of municipal jurisdiction, spam, or duplicate entries.

## Typography

Typography is set exclusively in **Plus Jakarta Sans** across display, body, and UI controls, chosen for its structural legibility and humane geometric forms. Tracking is tightened on larger headings for a cohesive editorial appearance, while body and label sizes retain neutral tracking for effortless readability.

### Monospaced Utility
For ticket tracking numbers (e.g., `#RPT-2024-8841`), geographic coordinates (`47.0245° N, 28.8322° E`), and time audit stamps, the system requires tabular, slashed-zero numerals utilizing **JetBrains Mono**. This prevents horizontal jitter in dynamic operational dashboards and guarantees fast character differentiation during dispatch telephone calls.

## Layout & Spacing

The layout is built on a responsive 12-column grid system paired with an 8px base rhythm (`0.5rem`).

### Grid Configuration
- **Mobile (<768px):** 4-column fluid layout with 16px (`gutter`) gutters and 16px (`margin`) edge offsets. Primary operational flow shifts to a persistent map sheet layout with drawer overlays.
- **Tablet (768px - 1023px):** 8-column layout with 16px gutters and 24px (`margin-tablet`) outer margins. Split views stack dynamically.
- **Desktop (≥1024px):** 12-column layout with 24px (`gutter-desktop`) gutters and 40px (`margin-desktop`) margins. Max-width constraints cap administrative data panels at 1440px while permitting interactive maps to extend edge-to-edge.

### Spatial Discipline
Inner-component spacing strictly follows the `space-*` scale:
- `space-xs` (4px): Pill dot separation, inline icon offsets.
- `space-sm` (8px): Form input inner vertical padding, badge internal gaps.
- `space-md` (16px): Input horizontal padding, card internal cell spacing, cluster badge padding.
- `space-lg` (24px): Stacked card groups, standard section margins.
- `space-xl` (32px): Primary modal padding, section header gaps.

## Elevation & Depth

To avoid generic SaaS visual tropes, the system eliminates heavy diffuse drop shadows and artificial colored glows. Elevation is established through crisp surface hierarchy, micro-borders, and tactile contact shadows.

### Elevation Levels
- **Level 0 (Flat Surface):** `border: 1px solid #e2e8f0; background: #ffffff;` Used for base data tables, timeline backgrounds, and citizen card containers.
- **Level 1 (Interactive Surface):** `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;` Applied to citizen report cards, form input fields, and search modules.
- **Level 2 (Floating Controls & Popovers):** `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.06); border: 1px solid #cbd5e1;` Applied to map controls, issue category filter chips, and flyout navigation.
- **Level 3 (Map Pins & Dialog Modals):** `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.08);` Applied to active teardrop pins and citizen upload confirmation sheets.

## Shapes

The design uses a clean, modern aesthetic with a `roundedness` level of **2** (`8px / 0.5rem`). This provides approachable curves for citizens without sacrificing the administrative rigor required by data screens.

### Shape Hierarchy
- **Base (0.5rem / 8px):** Form fields, input selectors, administrative cards, data tables, and image thumbnails.
- **Large (1rem / 16px):** Modal dialogs, bottom sheets on mobile, citizen wizard step cards.
- **Full / Pill (`9999px`):** Status indicators, cluster count indicators, deadline badges, and primary action buttons.
- **Teardrop (Specialty Shape):** Map marker pin geometry consisting of a top circular geometry (24px radius) joined to a bottom 90-degree pointed anchor tip.

## Components

### 1. Buttons
- **Primary:** Background `#0d9488` (`brand-600`), text `#ffffff`, border radius `9999px` (pill), height `44px` (touch-target compliance). Hover: `#0f766e` (`brand-700`). Active: `#115e59` (`brand-800`). Focus: 2px ring offset, 2px ring in `#14b8a6`.
- **Secondary / Outline:** Background `#ffffff`, border `1px solid #cbd5e1`, text `#0f172a`. Hover: background `#f8fafc`, border `#0f172a`.
- **Ghost:** Text `#475569`, background transparent. Hover: background `#f1f5f9`, text `#0f172a`.

### 2. Map Pins & Badges
- **Teardrop Map Pins:** 36×44px teardrop shape. 2px solid white (`#ffffff`) perimeter stroke with Level 3 elevation. Center contains a 20px status color circle (`#ef4444`, `#f59e0b`, `#14b8a6`, `#64748b`) holding a white SVG category icon (14×14px).
- **Category Badge:** Circular 32px badge with status color background, containing a crisp white vector icon matching the 6 municipal vectors:
  - *Pothole:* Traffic cone
  - *Broken streetlight:* Lightbulb off
  - *Garbage:* Trash can
  - *Damaged road:* Construction barrier
  - *Green space:* Tree
  - *Other:* Question mark in circle
- **Status Pills:** Height 24px, pill-shaped (`9999px`), padding `0 10px`. Contains an internal 6px solid circular dot preceding the status text in `label-md`. 
  - *New:* Background `#fef2f2`, Dot/Text `#b91c1c`.
  - *In progress:* Background `#fffbeb`, Dot/Text `#b45309`.
  - *Resolved:* Background `#f0fdfa`, Dot/Text `#0f766e`.
  - *Rejected:* Background `#f1f5f9`, Dot/Text `#475569`.
- **Group Pills:** Pill shape with `#0f172a` fill, `#ffffff` text, font `code-sm`, e.g., "3 reports". Used for overlapping map coordinates.
- **Deadline Badges:** Pill-shaped indicator communicating resolution targets:
  - *Normal:* `> 5 days` — `#f1f5f9` fill, `#475569` text ("12 days left").
  - *Approaching:* `≤ 3 days` — `#fffbeb` fill, `#b45309` text ("3 days left").
  - *Breached:* Overdue — `#fef2f2` fill, `#b91c1c` text ("3 days overdue").

### 3. Accessible Form Inputs
- Top-aligned, persistent `label-lg` in `#0f172a`. Never rely on placeholders as labels.
- Minimum height `44px`, background `#ffffff`, border `1px solid #cbd5e1`, padding `0.5rem 1rem`.
- Focus state: border color `#0d9488`, shadow ring `0 0 0 3px #ccfbf1`.
- Error state: border color `#ef4444`, helper copy rendered in `#b91c1c` with an inline error icon.

### 4. Verification Checkbox (ALTCHA)
- Dedicated anti-bot container: border `1px solid #e2e8f0`, background `#f8fafc`, radius `0.5rem`, padding `12px 16px`.
- Checkbox target: 20×20px, radius 4px, border `2px solid #cbd5e1`. Active checked state: `#0d9488` background with an integrated white checkmark. Accompanied by "I am human" label and cryptographically secure verification badge.

### 5. Issue Timeline Nodes
- Vertical connecting line: `2px solid #e2e8f0`.
- Nodes: 24×24px circle. Complete steps feature `#0d9488` with a white checkmark; active step features `#ffffff` with a `2px solid #0d9488` and a center 8px brand dot; future steps use `#ffffff` with a `2px solid #cbd5e1`.
- Metadata includes author title, relative timestamp, and monospace resolution ID.

### 6. Staff Admin Data Tables
- Crisp, non-alternating white rows separated by `1px solid #e2e8f0`.
- Header row: background `#f1f5f9`, text `label-md` in `#475569`, uppercase, tracking `0.05em`.
- Row height: condensed `48px` for administrative efficiency. Monospaced cells for reference numbers (`code-sm`).
- Hover state: background `#f8fafc` with immediate row action buttons revealing on pointer focus.