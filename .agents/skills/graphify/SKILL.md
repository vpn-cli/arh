---
name: graphify
description: Helps with visual design direction, UI composition, visual relationships, layouts, assets, and graphical elements while preserving the project's indie-game, handcrafted aesthetic.
---

# Graphify

**Purpose**: Visual design direction, UI composition, visual relationships, layouts, assets, and graphical elements.

## Behavior
- Analyze the existing project's visual language before making changes.
- Preserve the project's established aesthetic rather than replacing it with generic AI-generated design.
- Prefer **indie-game, handcrafted, playful, pixel-art, scrapbook, retro, and intentionally imperfect visual language** where it fits the existing project.
- Think in terms of:
  - composition
  - hierarchy
  - spacing
  - visual rhythm
  - layering
  - depth
  - backgrounds
  - decorative assets
  - textures
  - framing
  - transitions
  - interactive visual elements
- When proposing or implementing a visual change, explain **where the element belongs, what layer it belongs to, how it interacts with existing elements, and why it fits the scene**.
- Reuse existing assets and components whenever possible.
- Avoid unnecessary creation of new components/assets when an existing one can be adapted.
- Never blindly redesign an existing page.
- Before modifying a page, inspect its current implementation and understand the existing layout and interaction logic.
- Keep visual elements performant and responsive.
- Avoid excessive gradients, excessive glassmorphism, generic SaaS styling, stock illustrations, and obviously AI-generated visuals unless explicitly requested.

## Graphify workflow
For visual/design requests:
1. Inspect the current page/component.
2. Identify the existing visual language.
3. Identify reusable assets/components.
4. Determine the visual hierarchy and layering.
5. Propose the smallest coherent set of changes.
6. Implement the changes without breaking existing functionality.
7. Verify the result against the original design intent.
8. Only introduce new assets/components when necessary.

## Asset handling
Before creating a new visual asset:
1. Search the existing asset directory.
2. Check whether an existing asset can be reused, cropped, masked, recolored, layered, or transformed.
3. If a new asset is genuinely required, define exactly:
   - dimensions/aspect ratio
   - visual style
   - transparency requirements
   - intended placement
   - interaction/animation requirements

Do not randomly generate assets simply to fill empty space.

## Combined Graphify + Ponytail behavior
When a request involves both **design and implementation**, use both skills together.
**Graphify** decides the visual/compositional direction. **Ponytail** decides how to implement it safely within the existing codebase.

The process should be:
`Understand → Inspect → Compose → Reuse → Implement → Validate`

Do NOT:
- rebuild the entire page unnecessarily
- replace functioning interactions
- create duplicate components
- overwrite working animation logic
- change the project's visual identity without instruction
- introduce generic AI-looking UI
- introduce unnecessary dependencies
- create placeholder assets when existing assets can be reused

## Important project principle
This project is an intentionally handcrafted **indie-game experience**, not a conventional web/SaaS interface.
Prioritize:
- personality
- charm
- visual storytelling
- handcrafted imperfections
- playful interactions
- pixel/retro aesthetics where appropriate
- coherent world-building
- tactile UI
- small delightful details

over:
- generic modern dashboards
- excessive polish
- sterile layouts
- template-like UI
- excessive rounded cards
- generic gradients
- glassmorphism
- AI-generated-looking decorative elements
