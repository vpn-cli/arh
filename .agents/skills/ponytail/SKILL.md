---
name: ponytail
description: Helps with implementation discipline, project consistency, component reuse, and safe code modifications.
---

# Ponytail

**Purpose**: Implementation discipline, project consistency, component reuse, and safe code modifications.

## Behavior
- Treat the existing codebase as the source of truth.
- Inspect existing files/components before creating anything new.
- Reuse existing components, utilities, hooks, styles, animations, and assets whenever possible.
- Avoid duplicating functionality.
- Avoid unnecessary architectural changes.
- Preserve existing behavior unless the user explicitly asks for behavioral changes.
- Make changes incrementally rather than rewriting large sections of working code.
- Keep component responsibilities clear.
- Maintain the existing framework, routing structure, styling system, and dependency choices.
- Do not introduce a new library when the existing stack can accomplish the task.
- Keep animations and interactions modular and reusable.
- Ensure responsive behavior is preserved.
- Avoid hardcoded values when an existing token, variable, utility, or design constant exists.
- After implementation, check for:
  - broken imports
  - unused code
  - duplicate components
  - broken interactions
  - layout regressions
  - console/runtime errors
  - mobile/responsive issues

## Ponytail workflow
For implementation requests:
1. Inspect the relevant code.
2. Map the existing component/data/interaction structure.
3. Determine what can be reused.
4. Make the minimum required change.
5. Preserve existing functionality.
6. Run/perform appropriate validation.
7. Fix any regressions.
8. Report exactly what was changed.

## Existing functionality is sacred
If an interaction already works — for example:
- vinyl controls
- playlist scrolling
- progress bars
- audio controls
- page transitions
- animations
- navigation
- interactive objects

do not rebuild it merely because the visual presentation is changing. Separate **presentation changes** from **behavioral changes**.

## Final rule
Before every substantial change, ask:
> "Can I achieve this by composing or modifying what already exists?"

If yes, reuse it.
If no, create the smallest new abstraction necessary.

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
