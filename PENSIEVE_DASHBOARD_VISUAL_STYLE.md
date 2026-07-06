# Pensieve Dashboard Visual Style Guide

## Purpose

This document captures the reusable visual language of the current Pensieve dashboard so future interfaces can preserve the same tone, material quality, and readability.

It is intended to be practical rather than theoretical:

- how the interface should feel
- what visual rules should stay stable
- what to reuse when building new panels or plugin surfaces

---

## 1. Core Mood

Pensieve should feel like:

- quiet
- refined
- premium
- readable
- softly atmospheric

It should **not** feel like:

- a fantasy game UI
- a neon hacker dashboard
- a dark enterprise admin panel
- a decorative concept mockup

The target impression is:

**a calm memory observability tool with subtle fog, soft glass, and disciplined hierarchy**

---

## 2. Palette Direction

The active palette is based on:

- warm off-white
- pale fog grey
- Morandi green
- Morandi cyan
- muted slate text

### Color behavior

- use low saturation by default
- prefer softened green-cyan accents over bright blue
- keep backgrounds light and hazy
- keep text dark enough for product-grade readability
- reserve warmer tones only for risk or error signaling

### Practical palette roles

- page atmosphere: pale mineral white + cool mist
- panel borders: muted green-grey
- panel glow: faint silver-green
- primary accent: dusty green-cyan
- selected state: slightly deepened green mist
- high-risk state: muted clay-rose, never bright red

---

## 3. Surface Language

The main material style is:

**enchanted glass without fantasy excess**

### Panels

Panels should use:

- layered translucent white backgrounds
- thin low-contrast green-grey borders
- soft inner highlight
- broad shallow shadow
- subtle blur

Panels should avoid:

- hard black outlines
- sharp contrast jumps
- thick borders
- aggressive drop shadows

### Background

The page background should combine:

- radial haze
- soft atmospheric gradients
- faint white filament or veil lines
- restrained grid or structure cues when helpful

The background must stay supportive, not attention-seeking.

---

## 4. Typography

Typography is one of the main quality signals in this design system.

### Title treatment

Use a serif display face for major identity moments:

- dashboard title
- hero title
- occasionally large feature labels

Desired qualities:

- literary
- intelligent
- high-contrast
- restrained

### UI text treatment

Use clean sans-serif text for:

- body copy
- metadata
- pills
- controls
- labels

### Hierarchy rules

There are five main text tiers:

1. `dashboard-heading`
   Used for the primary panel identity.

2. `dashboard-section-title`
   Used for section-level anchors like Snapshot, Priority, Memory List.

3. `dashboard-subcopy`
   Used for quiet explanatory copy under a section title.

4. `dashboard-kicker`
   Used for small uppercase overlines that frame a section.

5. `dashboard-meta-note`
   Used for metadata, counts, timestamps, and lightweight labels.

### Tone rules

- keep copy concise
- avoid dense paragraphs
- prefer calm declarative language
- let spacing do part of the hierarchy work

---

## 5. Spacing and Density

Pensieve should feel compact but breathable.

### Density principle

- collapsed mode: efficient overview
- expanded mode: comfortable inspection

### Spacing behavior

- card interiors should feel padded, not airy
- gaps should be consistent and quiet
- stacked sections should feel rhythmically spaced
- interaction clusters should have slightly stronger separation than passive content

### Practical rule

When in doubt:

- reduce clutter before reducing spacing
- preserve scanability before adding decoration

---

## 6. Controls and Interaction

Controls should feel tactile but understated.

### Buttons

Buttons should use:

- rounded pill forms
- soft glass fill
- thin border
- gentle lift on hover
- minimal motion

### Hover language

Hover feedback should suggest:

- presence
- responsiveness
- precision

It should not feel bouncy, glossy, or loud.

### Selected states

Selected elements should be indicated through:

- slightly deeper tinted background
- slightly stronger border
- clearer shadow separation

Avoid relying on saturated color alone.

---

## 7. Memory Card Language

Memory rows are the most important recurring object in the dashboard.

They should feel like:

- structured fragments
- suspended recollections
- inspectable units

### Collapsed row rules

Collapsed rows should prioritize:

- memory fragment
- status
- risk

They should stay efficient and overview-oriented.

### Expanded row rules

Expanded rows should reveal:

- priority bar
- keywords
- metadata
- action cluster

The action cluster should be the strongest sub-section inside the expanded row.

### Action area

The action area should feel:

- framed
- lightly elevated
- clearly interactive

It should read as a governance surface, not a generic button row.

---

## 8. Chips, Pills, and Tags

These elements are important for the Pensieve style because they express structured memory without feeling heavy.

### Chips

Keyword chips should:

- be rounded
- use low-contrast fills
- vary slightly by strength
- feel soft and composable

### Status pills

Status pills should:

- read cleanly at a glance
- avoid over-bright colors
- preserve a tool-like tone

### Stronger states

The strongest chips may use:

- slightly deeper accent fill
- slightly stronger border
- a small amount of extra shadow

But they should still remain calm.

---

## 9. Motion and Transition

Motion should be almost invisible.

Allowed motion qualities:

- short easing
- light hover lift
- width expansion
- shadow deepening

Avoid:

- springy animation
- dramatic fades
- large parallax
- decorative particle effects

Pensieve should feel still, not animated.

---

## 10. Reusable Component Rules

When building new Pensieve panels, reuse this checklist:

### Every new panel should have

- a quiet kicker
- a strong section title
- optional one-line subcopy
- one clear primary content block
- consistent border and shadow treatment

### Every interactive cluster should have

- visible grouping
- restrained hover feedback
- readable labels
- enough spacing to avoid accidental density

### Every new state should preserve

- low saturation
- high readability
- material softness
- product seriousness

---

## 11. Things To Avoid

Do not introduce:

- pure black panels
- bright cyan glows
- heavy gradients with strong hue contrast
- gold fantasy accents
- decorative icon overload
- high-noise textures
- oversized shadows
- sharp glassmorphism clichés

If a visual choice starts to feel flashy, it is probably off-style.

---

## 12. One-Line Style Summary

Pensieve uses a **soft Morandi green-cyan glass system** with **foggy light backgrounds, serif-led identity, precise sans-serif UI hierarchy, and understated tactile controls** to make memory observability feel calm, intelligent, and trustworthy.
