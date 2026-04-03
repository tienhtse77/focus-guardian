# Design System Specification: Editorial Tranquility

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Curated Sanctuary."** 

We are moving away from the "SaaS-standard" dashboard—which often feels cluttered and mechanical—toward a high-end editorial experience. This system prioritizes breathing room, intentional asymmetry, and tonal depth over rigid lines. By leveraging the 24px/16px radius logic and a "No-Line" philosophy, we create a UI that feels less like software and more like a premium physical object. We treat every dashboard as a gallery space: quiet, authoritative, and meticulously organized.

---

## 2. Color & Tonal Architecture
The palette is rooted in organic, desaturated tones that reduce cognitive load while maintaining a sophisticated warmth.

### Core Palette
*   **Primary (Sage):** `#4E6358` (Derived from `#8CA295`) — Used for moments of focus and brand presence.
*   **Surface (Off-White):** `#F9F9F8` — Our "Canvas."
*   **On-Surface (Warm Charcoal):** `#2D3433` (Derived from `#3A3F3D`) — For high-contrast legibility.

### The "No-Line" Rule
**Designers are strictly prohibited from using 1px solid borders for sectioning.** 
Structural boundaries must be defined through background color shifts. 
*   Use `surface-container-low` (`#F2F4F3`) for subtle sections.
*   Use `surface-container` (`#EBEEED`) for deeper nesting.
*   This creates "soft boundaries" that guide the eye without creating visual noise.

### The Glass & Gradient Rule
To add "soul" to digital elements, primary actions should utilize a subtle linear gradient: 
*   **Signature CTA:** `primary` (#4E6358) to `primary_dim` (#43574C) at a 145° angle.
*   **Glassmorphism:** For floating overlays (e.g., tooltips, quick-actions), use `surface_container_lowest` at 80% opacity with a `12px` backdrop blur.

---

## 3. Typography: The Editorial Voice
We utilize a pairing of **Manrope** for structure and **Inter** for utility.

*   **Display (Manrope):** Large, airy, and bold. Use `display-md` (2.75rem) for dashboard hero numbers or welcome headers.
*   **Headline (Manrope):** Tight tracking (-2%) to give a premium, "printed" feel.
*   **Title (Manrope):** Use `title-md` (1.125rem) for card headers to ensure they feel like book chapter titles rather than app labels.
*   **Label (Inter):** Reserved for technical data, small caps, or "quick-action" tooltips. Inter’s x-height provides clarity at `label-sm` (0.6875rem).

---

## 4. Elevation & Depth
In this design system, elevation is an atmospheric property, not a structural one.

*   **Tonal Layering:** Depth is achieved by "stacking." A `surface-container-lowest` (#FFFFFF) card sits atop a `surface-container-low` (#F2F4F3) background. This creates a natural "lift" without a single pixel of shadow.
*   **Ambient Shadows:** If a component must float (e.g., a modal), use a "Cloud Shadow": 
    *   `Y: 12px, Blur: 32px, Color: rgba(45, 52, 51, 0.04)`. 
    *   The shadow color must be a tint of `on-surface`, never pure black.
*   **Ghost Borders:** If accessibility requires a border, use `outline-variant` at 15% opacity. It should be felt, not seen.

---

## 5. Dashboard Components

### Progress Rings
*   **Base:** `surface-container-high` (#E4E9E8).
*   **Indicator:** `primary` (#4E6358) with rounded caps.
*   **Detail:** For high-end polish, apply a very subtle inner glow to the indicator to mimic a recessed LED.

### Subtle List Items
*   **Layout:** No dividers. Use `8px` of vertical spacing between items.
*   **States:** On hover, transition the background to `surface-container-lowest` and apply the `md` (1.5rem/24px) corner radius to the entire row. This "lifting" effect replaces the need for a click-state border.

### Quick-Action Icon Buttons
*   **Shape:** `full` (9999px) for a soft, pebble-like feel.
*   **Sizing:** 32px x 32px.
*   **Visuals:** `surface-container-highest` background with a `primary` icon. On hover, invert to `primary` background with `on-primary` icon.

### Quote Blocks / Insights
*   **Geometry:** 24px corner radius.
*   **Styling:** Use `tertiary-container` (#FAECDC) for the background to provide a "warm paper" feel. 
*   **Detail:** Instead of a vertical line on the left, use a large, 20% opacity quotation mark in `tertiary` as a background watermark in the top-right corner.

### Cards
*   **Outer Radius:** `lg` (2rem / 32px) for main containers or `md` (1.5rem / 24px) for standard dashboard widgets.
*   **Inner Radius:** `DEFAULT` (1rem / 16px) for all elements contained within. This nested radius logic (Outer - Padding = Inner) is vital for visual harmony.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Place a large progress ring off-center within a card to create visual interest.
*   **Use Tonal Shifts:** Define the sidebar solely by making it `surface-container-low` against a `surface` main content area.
*   **Prioritize White Space:** If you think there is enough padding, add 20% more.

### Don’t:
*   **No Dividers:** Never use a horizontal line to separate list items. Use space or tonal blocks.
*   **No High Contrast Shadows:** Avoid the "floating card" look of 2014 Material Design. Shadows should be nearly invisible.
*   **No Pure Greys:** Every "grey" in this system must be tinted with sage or charcoal warmth to avoid a "dead" UI.