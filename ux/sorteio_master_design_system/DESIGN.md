---
name: Sorteio Master Design System
colors:
  surface: '#101417'
  surface-dim: '#101417'
  surface-bright: '#363a3d'
  surface-container-lowest: '#0b0f11'
  surface-container-low: '#191c1f'
  surface-container: '#1d2023'
  surface-container-high: '#272a2d'
  surface-container-highest: '#323538'
  on-surface: '#e0e3e6'
  on-surface-variant: '#d2c5af'
  inverse-surface: '#e0e3e6'
  inverse-on-surface: '#2d3134'
  outline: '#9b8f7b'
  outline-variant: '#4f4635'
  surface-tint: '#f3bf45'
  primary: '#f7c248'
  on-primary: '#402d00'
  primary-container: '#d9a72e'
  on-primary-container: '#563e00'
  inverse-primary: '#795900'
  secondary: '#b7c7ea'
  on-secondary: '#21304c'
  secondary-container: '#3a4966'
  on-secondary-container: '#a9b8db'
  tertiary: '#b5caf5'
  on-tertiary: '#1a3053'
  tertiary-container: '#9aafd8'
  on-tertiary-container: '#2d4265'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdf9f'
  primary-fixed-dim: '#f3bf45'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5c4300'
  secondary-fixed: '#d7e2ff'
  secondary-fixed-dim: '#b7c7ea'
  on-secondary-fixed: '#0a1b36'
  on-secondary-fixed-variant: '#384764'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#b2c7f1'
  on-tertiary-fixed: '#011b3d'
  on-tertiary-fixed-variant: '#32476b'
  background: '#101417'
  on-background: '#e0e3e6'
  surface-variant: '#323538'
typography:
  display-hero:
    fontFamily: Montserrat
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
  display-hero-mobile:
    fontFamily: Montserrat
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  headline-xl:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-xl-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  counter-display:
    fontFamily: Montserrat
    fontSize: 72px
    fontWeight: '900'
    lineHeight: 80px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4.5rem
---

## Brand & Style

The brand visual identity pairs the analytical rigor of high-stakes compliance software with the vibrant, theatrical anticipation of premium gaming and sweepstakes platforms. It bridges two distinct modes: an authoritative, structured SaaS operations control center and an electrified, high-definition broadcast theater for live drawing events.

### Style Archetype
**Prestige Tactile & Neumorphic Glass:** A synthesis of deep nautical substrates, micro-beveled borders, warm metallic gold halos, and crisp editorial layouts. Interfaces evoke physical mechanical consoles, polished brass trims, and broadcast-grade live production equipment without losing modern web efficiency.

### Emotional Target
- **Integrity & Trust:** Administrative interfaces rely on crisp tabular forms, precise metadata density, and clinical data clarity.
- **Prestige & Excitement:** Drawing screens feature glowing radiant lighting, illuminated metallic edges, and energetic momentum that build anticipation for winners.

## Colors

The color architecture is built strictly upon deep ocean foundations, warm noble golds, and crisp functional status indicators.

### Palette Architecture
- **Primary Accent (`#D9A72E` - Metallic Gold):** Reserved for primary interactive elements, awarded numbers, active roulette pegs, trophy status badges, and focal callouts. Secondary metallic gradient variant: linear from `#FFDF79` to `#B68218`.
- **Primary Substrate (`#091A35` - Deep Navy):** The structural root of the design system. Acts as canvas background for roulette broadcast views and high-contrast administrative surface panels.
- **Secondary Elevated Substrate (`#142B4D` - Dark Blue Slate):** Used for raised administrative cards, sidebar panels, input shells, table headers, and modal backdrops.
- **Neutral Canvas & Typography Light (`#F4F6FA` - Off-White / Slate 50):** The primary readable text layer over dark themes, and the optional high-clarity background in light-mode reporting exports.
- **Pure White (`#FFFFFF`):** High-impact numerical readouts, active button labels, winning spotlight values, and specular highlights.
- **Semantic Success (`#16A34A`):** Validated tickets, confirmed participant batches, and completed drawings.
- **Semantic Danger (`#DC2626`):** Disqualified numbers, cancellation warnings, and destructive irreversible actions.

### Dynamic Theming Guidelines
- **Roulette & Live Stage Screens:** Immersive dark mode (`#091A35` dominant) with radial spotlights (`rgba(217, 167, 46, 0.15)`) centered on the wheel spinner.
- **Admin & Management Console:** Dark Slate mode (`#142B4D` container blocks over `#091A35` base) accented with hairline gold borders (`rgba(217, 167, 46, 0.25)`).

## Typography

Typography establishes an unambiguous hierarchy between monumental draw results and intricate operational data.

### Font Pairing Logic
- **Montserrat (Display & Headlines):** Imparts weight, grandeur, and stage impact. Bold, high-energy forms create striking numbers on the roulette dial, modal announcements, and primary KPI metrics.
- **Plus Jakarta Sans (Body Text & Conversational UI):** Delivers clean optical balance and high legibility across long participant lists, campaign descriptions, and administrative settings.
- **Inter (Labels, Tables, Data Grids & Tooltips):** Utilized for monospaced numerical alignments, dense table column definitions, badges, and button labels to prevent visual crowding.

### Numerical Data Execution
All numerical ticket values, financial tallies, and timestamps must leverage tabular numbers (`font-variant-numeric: tabular-nums`) to prevent layout shifting during real-time animation countdowns.

## Layout & Spacing

The system enforces a flexible 12-column responsive fluid grid designed around two distinct usage environments: the productivity-focused administrative back-office and the presentation-focused live stage roulette.

### Breakpoint Structure
- **Mobile (320px - 767px):** 4-column structure. Global margins compress to `margin-mobile` (1rem). Navigation shifts to a persistent bottom bar and a side drawer anchored to `#142B4D`.
- **Tablet (768px - 1023px):** 8-column layout. Gutter set to 1rem. Sidebars collapse to icon-only navigation with floating flyout menus.
- **Desktop (1024px - 1440px+):** 12-column layout. Gutter set to 1.5rem. Fixed lateral navigation panel (260px width) with an elevated workbench container.
- **Broadcast / Projection Mode (1920px+):** Fullscreen theater view with 0px margin bounds, utilizing centered stage constraints with maximum focal clarity.

### Component Spacing Principles
- Spacing inside tabular rows is dense (`space-xs` vertical, `space-md` horizontal).
- Interactive card clusters maintain rhythmic separation using `space-lg`.
- Critical drawing display centers maintain an expansive buffer (`space-3xl`) to draw absolute focus toward the spinning mechanical wheel.

## Elevation & Depth

Visual hierarchy uses physical depth cues, layering deep navy substrates with beveled edges and warm amber ambient light.

### Depth Layers
- **Floor Level (Canvas):** `#091A35` solid foundation, absorbs outer focus.
- **Tier 1 (Panels & Cards):** `#142B4D` surface elevated by a subtle 1px border colored `rgba(217, 167, 46, 0.15)` combined with a soft drop shadow: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4)`.
- **Tier 2 (Modals & Sticky Drawers):** Elevated surface with linear sheen: border `1px solid rgba(217, 167, 46, 0.35)`, layered over `box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6)`.
- **Tier 3 (Winning Announcements & Roulette Rim):** Double-ring highlight. Exterior: `0 0 28px rgba(217, 167, 46, 0.45)`. Interior: inset bevel `inset 0 1px 2px rgba(255, 255, 255, 0.3)`.

### Lighting Direction
Simulated overhead directional rim lighting creates subtle top-edge highlights on buttons and panel headers (`inset 0 1px 0 rgba(255, 255, 255, 0.15)`), grounding elements in a consistent physical space.

## Shapes

The design system employs a refined rounded shape language (`roundedness: 2`), balancing the engineered feel of tech dashboards with the friendly contours of classic game consoles.

### Geometry Specifications
- **Standard Inputs, Tables & KPI Cards:** 8px (`0.5rem`) corner radius for sharp alignment and clear grid boundaries.
- **Action Buttons, Filter Badges & Chips:** 16px (`1rem` / `rounded-lg`) corner radius for tactile affordance.
- **Modals, Floating Toolbars & Drawer Containers:** 24px (`1.5rem` / `rounded-xl`) corner radius, imparting a modern softened silhouette.
- **Ticket Balls & Roulette Components:** Pure 50% circle geometry with beveled radial trims.

## Components

### 1. Action Buttons
- **Primary Hero Button:** Gradient background from `#FFDF79` via `#D9A72E` to `#B68218`. Text is `#091A35` (Montserrat ExtraBold, uppercase, tracking +0.5px). Micro-bevel top highlight `inset 0 1px 1px rgba(255, 255, 255, 0.6)`. Hover: elevated gold bloom `0 0 20px rgba(217, 167, 46, 0.5)`.
- **Secondary Console Button:** Surface `#142B4D` with 1px border of `rgba(217, 167, 46, 0.4)`. Text `#FFFFFF`. Hover: background transitions to `#1E3E6D`.
- **Destructive Button:** Surface `rgba(220, 38, 38, 0.12)`, border `1px solid #DC2626`, text `#DC2626`. Hover: solid `#DC2626` with white text.

### 2. Status Chips & Number Badges
- **Drawn Number Orb:** Circular badge with dark slate background, concentric gold rim, and centered white/gold typography.
- **Filter Chips:** Pill shapes (`rounded-full`) in `#142B4D` with `#F4F6FA` text. When active, outline becomes solid `#D9A72E` with 10% gold background wash.

### 3. Data Grids & Admin Tables
- Header row wrapped in `#091A35` with uppercase tracking in `label-sm`.
- Rows rendered in `#142B4D` with alternating faint zebra striping (`rgba(255, 255, 255, 0.02)`).
- Cell border divider: hairline `rgba(244, 246, 250, 0.06)`.
- Numeric columns pinned right with monospaced alignment.

### 4. Form Inputs & Search Fields
- Shell background: `#091A35` inset.
- Border: `1px solid rgba(244, 246, 250, 0.15)`.
- Focus state: border transitions to `#D9A72E` with outer glow ring `0 0 0 3px rgba(217, 167, 46, 0.2)`. Placeholder text in muted off-white (`rgba(244, 246, 250, 0.4)`).

### 5. KPI & Summary Cards
- Deep Blue Slate `#142B4D` background with 1px top border accented with 40% gold opacity.
- Top-right icon container with gold or sapphire neon ambient glow.
- Large numerical display using `counter-display` or `headline-lg` in `#FFFFFF` with descriptive subtitle in `label-md` `#D9A72E`.

### 6. Interactive Roulette Wheel (Broadcast Component)
- Exterior chassis: dual metallic gold casing with perimeter fairground bulbs (`#FFDF79` with animated pulsing glow).
- Pointer indicator: ruby red wedge (`#DC2626`) anchored top-center with gold metallic frame and drop shadow.
- Center hub: domed badge bearing the system brand signature with high-gloss specular reflections.
- Number slices: alternating high-contrast deep navy, emerald, royal cobalt, and ruby segments with crisp white numbers rotated along slice radii.