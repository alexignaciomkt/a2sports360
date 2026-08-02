---
name: Kinetic Performance System
colors:
  surface: '#121415'
  surface-dim: '#121415'
  surface-bright: '#38393a'
  surface-container-lowest: '#0c0e0f'
  surface-container-low: '#1a1c1d'
  surface-container: '#1e2021'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333536'
  on-surface: '#e2e2e3'
  on-surface-variant: '#c0caad'
  inverse-surface: '#e2e2e3'
  inverse-on-surface: '#2f3132'
  outline: '#8a947a'
  outline-variant: '#414a34'
  surface-tint: '#8bdc00'
  primary: '#ffffff'
  on-primary: '#1f3700'
  primary-container: '#9ffb00'
  on-primary-container: '#457000'
  inverse-primary: '#406900'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#ffffff'
  on-tertiary: '#2e3132'
  tertiary-container: '#e1e3e4'
  on-tertiary-container: '#626566'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9ffb00'
  primary-fixed-dim: '#8bdc00'
  on-primary-fixed: '#102000'
  on-primary-fixed-variant: '#2f4f00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#444748'
  background: '#121415'
  on-background: '#e2e2e3'
  surface-variant: '#333536'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 16px
  container-padding-desktop: 32px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

This design system is engineered for a high-performance "Sports Tech" environment. It draws inspiration from the precision of athletic tracking software and the intensity of competitive arenas. The aesthetic is a fusion of **Corporate Modern** structure and **High-Contrast** energy.

The brand personality is authoritative, energetic, and data-driven. It prioritizes clarity and rapid information processing. The UI evokes a sense of "readiness" through deep charcoal surfaces that provide a high-contrast stage for vibrant action signals. Visual metaphors should lean toward the technical and precise—think digital stopwatches, stadium lighting, and telemetry dashboards.

## Colors

The palette is anchored by "Electric Lime" (#A2FF00), a high-visibility hue used exclusively for primary actions, critical status updates, and interactive focal points. 

The background utilizes a layered dark-mode strategy. The base layer is a deep "Obsidian" (#0F1112), while elevated containers use "Iron" (#1A1D1E) to create subtle depth. Pure white is reserved for high-priority typography and icons to ensure maximum legibility. Use a muted "Slate" (#4A4F52) for borders and disabled states to maintain the dark-mode integrity without creating unnecessary visual noise.

## Typography

The typographic hierarchy balances impact with utility. **Hanken Grotesk** provides a sharp, contemporary feel for headlines, using heavy weights to convey strength and authority. 

**Inter** is utilized for body text to ensure comfortable reading of complex data and statistics. For technical metadata, scores, and timestamps, **JetBrains Mono** is employed to reinforce the "Sports Tech" narrative through its precise, monospaced character. Always use uppercase for labels to emphasize a "command center" aesthetic.

## Layout & Spacing

This design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The spacing rhythm is based on an 8px baseline. 

Layouts should feel dense but organized, similar to an athlete's performance dashboard. Use wide margins (32px+) on desktop to center focus on content cards, but tighten gutters (16px) within cards to maximize data density. Content should reflow vertically on mobile, with primary navigation pinned to the bottom or tucked into a high-visibility "Action Bar" at the top.

## Elevation & Depth

In this dark-mode environment, depth is communicated through **Tonal Layering** and **Subtle Inner Glows**. 

Avoid heavy drop shadows; instead, use slightly lighter background fills (Iron #1A1D1E) to indicate surface elevation. For the most prominent interactive elements, apply a 1px solid stroke in a muted Slate color. High-priority cards can utilize a very subtle "Electric Lime" outer glow (5-10% opacity) to suggest they are "active" or "live." Background blurs should be used sparingly, primarily for persistent headers or modal overlays to maintain focus.

## Shapes

The shape language is professional and "engineered." We use **Soft (0.25rem)** roundedness for standard elements like input fields and small buttons. Larger components, such as data cards or content containers, utilize **rounded-lg (0.5rem)**. 

Avoid fully circular (pill) buttons except for floating action buttons; the squared-off nature of the "Soft" setting better reflects the structural integrity of the brand logo's custom letterforms.

## Components

### Buttons
Primary buttons use a solid "Electric Lime" fill with black typography for maximum contrast. Secondary buttons use a Slate stroke with White text. Hover states for primary buttons should slightly brighten the lime green or add a subtle inner shadow to simulate a "pressed" physical feel.

### Cards
Cards are the primary container for data. They feature the "Iron" fill (#1A1D1E) with a subtle 1px border. For "Live" events, the border should transition to a pulsed "Electric Lime" stroke.

### Input Fields
Inputs use a dark background (#090B0C) to contrast against the card surface. The focus state is signaled by an Electric Lime border and a matching cursor color. Labels always sit above the field in JetBrains Mono.

### Chips & Badges
Used for categories (e.g., "Live," "Scheduled," "Final"). "Live" badges must pulse or use the primary brand color. All other chips should remain neutral (white text on a slate background) to avoid competing with primary calls to action.

### Lists
Data lists should use thin Slate dividers (0.5px). Alternating row highlights (zebra striping) can be used in data-heavy tables using a slightly lighter grey (#222527).