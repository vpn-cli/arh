Hamster Birthday Indie-Web Game
Project Overview & Step-by-Step Implementation Plan
Purpose: This document is the canonical implementation brief for
building the interactive birthday project with Antigravity / Claude.
Important: The workflow defined here is locked. Do not redesign
the information architecture or navigation unless explicitly
instructed.

1. Project Vision
Build a highly interactive, indie-game-inspired birthday website that
feels like a small playable world, not a conventional birthday
webpage.
The experience combines:
- cute hamster memes / illustrations
- retro indie-web aesthetics
- interactive storytelling
- scrapbook-like memories
- music
- personal birthday wishes
- playful UI and micro-interactions
- a small amount of mystery/discovery
The goal is for the recipient to feel like they are exploring a tiny
game made specifically for them.
The website should not feel like:
- a generic portfolio
- a SaaS landing page
- a template
- a standard birthday card
- a collection of unrelated sections
- excessive glassmorphism
- generic AI-generated web design
The website should feel intentional, handmade, playful, slightly
weird, nostalgic, and alive.
2. Canonical Information Architecture
The experience has a landing/intro sequence followed by a Home World.
LANDING / LOADING
        ↓
HAMSTER INTRO
        ↓
HOME WORLD
        │
        ├───────────────┬────────────────┐
        ↓               ↓                ↓
   MAIN WORLD      MUSIC WORLD     SCRAPBOOK WORLD
        │
        │ continuous scroll
        ↓
     ASCII ART
        ↓
 HAPPY BIRTHDAY VAULT  ← OPTIONAL
        │
        ↓
      WISHING
        ↓
       EDIT
        ↓
  LETTER / POEM
Critical navigation rule
There are three worlds accessible simultaneously from the Home
World:
1. Main World
2. Music World
3. Scrapbook World
There is no required order between these worlds.
The recipient may enter any world at any time.
The only intentional progression is inside Main World.
3. Home World
The Home World is the central hub.
It should feel like an indie game's world-selection / exploration
screen, not a conventional navbar.
The user should immediately understand:
"There are three places I can explore."

Conceptually:
                 HAMSTER

              WHERE TO GO?

        ┌────────────────────┐
        │                    │
        │     MAIN WORLD     │
        │                    │
        └────────────────────┘

        ┌────────────────────┐
        │                    │
        │     MUSIC WORLD    │
        │                    │
        └────────────────────┘

        ┌────────────────────┐
        │                    │
        │   SCRAPBOOK WORLD  │
        │                    │
        └────────────────────┘
This is only a structural example. The final visual design should be
much more creative and game-like.
Home World requirements
- Three destinations must be simultaneously accessible.
- Each destination needs a clear interactive affordance.
- Hover / focus / click states should feel alive.
- The hamster should have some relationship to the navigation.
- Navigation should not feel like a standard website menu.
- The user must always understand how to return to Home from a world.
- The Home World itself can contain ambient animation and
  micro-interactions.
4. Main World
The Main World is the primary narrative environment.
It is a continuous scroll experience.
The user enters at the beginning and progresses downward through the
environment.
Canonical order:
MAIN WORLD
    ↓
ASCII ART
    ↓
HAPPY BIRTHDAY VAULT
    ↓
WISHING
    ↓
EDIT
    ↓
LETTER / POEM
However, the Happy Birthday Vault is optional.
5. Happy Birthday Vault
The Happy Birthday Vault is NOT a mandatory section of the Main World
progression.
It is an optional interactive discovery.
The user can:
- ignore it
- continue scrolling
- notice it later
- explicitly open it
When opened, it launches the birthday/wishing experience.
Conceptually:
                 MAIN WORLD
                      ↓
                  ASCII ART
                      ↓
             ┌────────────────┐
             │ BIRTHDAY VAULT │
             │                │
             │  [ OPEN ]      │
             └───────┬────────┘
                     │
                 user opens
                     ↓
                WISHING
                     ↓
                  [CLOSE]
                     ↓
             RETURN TO MAIN WORLD
Critical behavior
Opening the Vault must not behave like navigating to the fourth
world.
It should feel like discovering an optional room/object inside the Main
World.
After closing it, the user should return to the Main World naturally.
Ideally, preserve the user's scroll position.
6. ASCII Art
The ASCII section belongs inside Main World.
Its role is primarily playful / weird / memorable.
It should not just be a static block of ASCII text.
Potential directions:
- animated ASCII
- terminal-like reveal
- hamster ASCII
- fake command execution
- interactive terminal
- unexpected responses
- small easter eggs
Do not finalize the exact content until the interaction design phase.
7. Wishing Experience
The wishing experience lives inside the optional Happy Birthday Vault.
It should feel like a contained birthday moment rather than a generic
text section.
Possible conceptual behavior:
VAULT OPENS
    ↓
Birthday reveal
    ↓
Wish / birthday message
    ↓
Interaction / animation
    ↓
Close
    ↓
Return to Main World
The actual content and interaction will be finalized later.
8. Edit
The Edit is a personalized media piece created specifically for the
recipient.
It belongs inside Main World after the Birthday Vault / wishing area.
It should feel like a discovered artifact within the world.
Possible presentation:
- old media player
- CRT-like player
- embedded video object
- handmade frame
- interactive playback UI
- surrounding hamster reactions
The exact treatment should be determined during visual design.
9. Letter / Poem
The Letter / Poem is the final major part of Main World.
This should act as an emotional payoff after the playful sections.
Potential interaction:
- handwritten reveal
- paper unfolding
- typewriter effect
- scrolling letter
- hamster delivering the letter
- envelope opening
Avoid making it feel like a generic text block.
The content itself will be supplied separately.
10. Music World
Music World is a completely independent world accessible directly from
Home.
HOME
  ↓
MUSIC WORLD
  ↓
music experience
  ↓
RETURN HOME
It should feel like its own small environment.
Potential concepts:
- radio
- cassette player
- music room
- bedroom
- record player
- desktop music player
- animated album artwork
The exact visual implementation is not locked yet.
Important:
- It is not part of Main World's scroll.
- It is not required before Scrapbook.
- It can be entered at any time.
- It must have a clear route back to Home.
11. Scrapbook World
Scrapbook World is also completely independent.
HOME
  ↓
SCRAPBOOK WORLD
  ↓
photos / memories / interactions
  ↓
RETURN HOME
The scrapbook should feel tactile and handmade.
Possible interactions:
- photographs sliding into place
- page turning
- stickers
- handwritten annotations
- pinned photographs
- overlapping images
- draggable objects
- hover reactions
- small hidden details
Avoid a generic image carousel unless it is heavily customized to fit
the world.
12. Navigation Rules
These rules are non-negotiable.
World-level navigation
HOME
 ├── MAIN WORLD
 ├── MUSIC WORLD
 └── SCRAPBOOK WORLD
The user can enter any of the three at any time.
Returning Home
Every world must have a clear Home / Back mechanism.
Main World:
Main World → Home
Music World:
Music World → Home
Scrapbook World:
Scrapbook World → Home
Main World internal flow
ASCII
 ↓
optional Vault
 ↓
Edit
 ↓
Letter / Poem
The Vault can be skipped.
13. Design Philosophy
The website should be treated as an interactive environment.
Think in terms of:
  Traditional Website   This Project
  Page                  World
  Navigation bar        World selection
  Hero section          Opening environment
  Card                  Interactive object
  Gallery               Scrapbook
  Video section         Discovered media artifact
  Text section          Letter / artifact
  Button                Game interaction
  Hover state           Character/object reaction
  Footer                Potential final world/ending
  Loading screen        Game boot sequence
The implementation should prioritize experience over information
density.
14. Visual Direction
The aesthetic is:
indie game + retro web + scrapbook + cute hamster chaos
Potential visual ingredients:
- warm/off-white backgrounds
- paper textures
- subtle grain
- chunky borders
- imperfect shapes
- stickers
- handwritten annotations
- retro UI
- CRT/terminal references where appropriate
- small decorative objects
- playful typography
- intentionally imperfect positioning
- subtle shadows
- animated sprites
- tiny ambient movements
Avoid:
- excessive glassmorphism
- generic gradient blobs
- corporate dashboard layouts
- excessive rounded SaaS cards
- sterile minimalism
- AI-looking illustrations
- excessive 3D
- over-polished motion that removes the handmade feeling
The result should feel designed, not randomly decorated.
15. Interaction Philosophy
The project should contain many small interactions.
Examples:
- hover reactions
- hamster movement
- blinking UI
- objects reacting to cursor
- click-to-reveal elements
- small sound/visual feedback where appropriate
- scroll-triggered animations
- typewriter text
- objects appearing after interaction
- tiny easter eggs
- hidden details
- animated stickers
- transitions between worlds
- interactive cards
However:
Do not add interactions merely because they are technically
possible.

Every interaction should reinforce the feeling of exploring a small
world.
16. Animation Philosophy
Animation should be layered.
Layer 1 --- Ambient
Always-running subtle motion:
- hamster breathing
- floating objects
- tiny background movement
- blinking lights
- subtle texture movement
Layer 2 --- Interaction
Triggered by:
- hover
- click
- scroll
- entering a world
Layer 3 --- Narrative
Major transitions:
- entering a world
- opening the Vault
- revealing the birthday message
- playing the Edit
- opening the Letter
- returning Home
Avoid excessive animation everywhere at once.
17. Technical Architecture
The implementation should be componentized around worlds and reusable
interactive objects.
Suggested structure:
src/
├── app/
│   ├── page.*
│   ├── main/
│   ├── music/
│   └── scrapbook/
│
├── components/
│   ├── navigation/
│   ├── hamster/
│   ├── worlds/
│   ├── ascii/
│   ├── vault/
│   ├── scrapbook/
│   ├── music/
│   ├── letter/
│   └── shared/
│
├── data/
│   ├── memories.*
│   ├── scrapbook.*
│   └── music.*
│
├── assets/
│   ├── hamster/
│   ├── scrapbook/
│   ├── textures/
│   ├── audio/
│   └── video/
│
└── styles/
The exact structure may change based on the chosen framework, but the
conceptual separation should remain.
18. State Model
Keep navigation state explicit.
Conceptually:
currentWorld:
  home
  main
  music
  scrapbook

mainWorld:
  vaultOpen: boolean
The Vault should be an overlay / local state inside Main World, not a
separate world.
If persistent interaction state is needed later, add it deliberately
rather than introducing global state prematurely.
19. Responsive Design
The experience must work on:
- desktop
- tablet
- mobile
But responsive behavior should preserve the experience, not merely
shrink the desktop design.
For mobile:
- world selection must remain obvious
- scroll interactions must remain usable
- hover-dependent interactions need touch equivalents
- scrapbook interactions must remain usable
- media must scale correctly
- text must remain readable
- animations should be reduced where performance requires it
20. Accessibility
Even though this is an experimental visual project:
- all meaningful buttons need accessible labels
- keyboard navigation should work
- focus states should exist
- images should have useful alt text where appropriate
- decorative images should be marked decorative
- animations should respect prefers-reduced-motion
- important content must not depend exclusively on hover
- audio should never autoplay unexpectedly without a clear user
  interaction
21. Performance Rules
The project will contain many visual assets and animations.
Therefore:
- optimize images
- lazy-load non-critical media
- avoid unnecessary continuous JS animation loops
- use CSS transforms where possible
- avoid huge unoptimized GIFs
- compress video/audio
- keep the initial landing experience lightweight
- load heavy world assets when appropriate
- avoid unnecessary dependencies
The first screen should load quickly before progressively loading the
richer experience.
22. Implementation Method
CRITICAL RULE
Do not build the entire project in one generation.
Antigravity / Claude should work incrementally.
Each phase should:
1. inspect the existing project
2. implement only the requested scope
3. run/build the project
4. verify behavior
5. report what changed
6. wait for approval before moving to the next major phase
Do not silently redesign completed work.
23. Phase 0 --- Project Audit
Before writing UI:
- inspect repository
- identify framework
- identify existing dependencies
- inspect existing assets
- inspect current routes
- inspect styling system
- inspect build configuration
- determine whether existing code should be preserved
Deliverable:
PROJECT_AUDIT.md
Do not redesign anything yet.
24. Phase 1 --- Foundation
Implement only:
- global styling foundation
- typography
- background treatment
- basic responsive setup
- reusable animation utilities
- reusable interaction primitives
- routing/navigation foundation
Do NOT build all worlds.
Deliverable:
A clean technical foundation ready for world implementation.
25. Phase 2 --- Landing / Boot
Implement:
- loading screen
- hamster intro
- transition into Home World
Focus on:
- timing
- visual identity
- first impression
- smooth transition
Do not implement the complete Home World yet.
26. Phase 3 --- Home World
Implement the complete world-selection environment.
Requirements:
- Main World destination
- Music World destination
- Scrapbook World destination
- interactive states
- hamster presence
- return/home logic foundation
At this point, the three worlds can initially be placeholder
environments.
Goal:
Verify the navigation architecture before building content.
27. Phase 4 --- Main World Shell
Build the continuous scrolling Main World.
At first, use placeholders for:
- ASCII
- Vault
- Edit
- Letter
Focus on:
- scroll structure
- section transitions
- pacing
- world boundaries
- persistent Home/back control
- responsive behavior
Do not fully implement the Vault or content yet.
28. Phase 5 --- ASCII Experience
Replace the placeholder with the actual ASCII interaction.
Focus on:
- visual treatment
- animation
- interaction
- timing
- responsive behavior
29. Phase 6 --- Happy Birthday Vault
Implement the optional Vault.
Requirements:
- visually discoverable
- not mandatory
- opens only when interacted with
- contains birthday/wishing experience
- can be closed
- returns user to Main World
- preserves scroll position
- does not become a fourth world
This phase should be treated independently from the rest of Main World.
30. Phase 7 --- Edit Experience
Implement the personalized Edit.
Focus on:
- presentation
- playback
- surrounding UI
- hamster reactions
- transition into/out of the media
31. Phase 8 --- Letter / Poem
Implement the final Main World emotional section.
Focus on:
- reveal
- typography
- pacing
- paper/letter interaction
- subtle animation
32. Phase 9 --- Music World
Build Music World as an independent environment.
Focus on:
- atmosphere
- music playback
- playlist interaction
- visual identity
- return Home behavior
33. Phase 10 --- Scrapbook World
Build the Scrapbook World.
Focus on:
- photographs
- page/scene structure
- tactile interactions
- stickers
- annotations
- transitions
- mobile interaction
34. Phase 11 --- Cross-World Polish
Once all worlds exist:
- unify transitions
- unify typography
- unify interaction language
- refine Home navigation
- add shared hamster behavior
- fix scroll restoration
- refine responsive behavior
- remove inconsistent UI
- improve loading behavior
35. Phase 12 --- Micro-Interactions & Easter Eggs
Only after the core experience works.
Add:
- hidden interactions
- hamster reactions
- tiny visual jokes
- unexpected animations
- cursor interactions
- subtle sounds
- secret details
- ??? content if finalized
Do not let easter eggs compromise usability.
36. Phase 13 --- Performance / Accessibility / QA
Test:
Navigation
- Home → Main
- Home → Music
- Home → Scrapbook
- Main → Home
- Music → Home
- Scrapbook → Home
Main World
- scroll from beginning to end
- open Vault
- close Vault
- preserve scroll position
- skip Vault
- access Edit
- access Letter
Responsive
- desktop
- tablet
- mobile
Accessibility
- keyboard
- focus
- reduced motion
- readable text
- touch interactions
Performance
- initial load
- image loading
- video loading
- animation performance
- mobile performance
37. Phase 14 --- Final Polish
Only after all functional requirements are complete:
- spacing refinement
- animation timing
- typography refinement
- texture refinement
- visual consistency
- transition polish
- final asset optimization
- remove debug UI
- final build
38. Development Rules for Antigravity / Claude
Use this project brief as the source of truth.
Rule 1 --- Do not invent architecture
Do not introduce additional worlds, routes, navigation systems, or major
sections without explicit approval.
Rule 2 --- Work incrementally
Never implement five phases simultaneously unless explicitly requested.
Rule 3 --- Preserve completed work
When working on a new phase, do not unnecessarily rewrite previous
phases.
Rule 4 --- Ask before major ambiguity
If a decision affects:
- information architecture
- navigation
- user flow
- major visual direction
- data structure
ask before implementing.
For small implementation decisions, choose the simplest sensible
solution.
Rule 5 --- Inspect before modifying
Always inspect the current code before making changes.
Rule 6 --- Verify after implementation
After each phase:
- run the app
- check console errors
- run build/type checks where applicable
- verify responsive behavior where relevant
Rule 7 --- Avoid placeholder-driven final design
Placeholders are acceptable during structural phases, but final UI
should not retain generic placeholder styling.
Rule 8 --- Prioritize interaction quality
A technically correct page with poor interaction quality is not
considered complete.
39. Definition of Done
The project is complete only when:
- the user can enter through the Landing experience
- the Hamster Intro transitions naturally to Home
- Home clearly presents the three worlds
- all three worlds are independently accessible
- Main World is continuously scrollable
- ASCII exists inside Main World
- the Birthday Vault is optional
- Vault opens only when accessed
- Vault closes back into Main World
- scroll position is preserved appropriately
- Edit exists inside Main World
- Letter / Poem exists inside Main World
- Music World is independent
- Scrapbook World is independent
- every world has a clear Home route
- mobile behavior works
- accessibility basics work
- performance is acceptable
- interactions feel cohesive
- visual language is consistent
- the website feels like an interactive indie game rather than a
  normal website
40. Current Status
ARCHITECTURE
████████████████████  LOCKED

WORKFLOW
████████████████████  LOCKED

VISUAL SYSTEM
░░░░░░░░░░░░░░░░░░░░  NOT FINALIZED

SCREEN DESIGN
░░░░░░░░░░░░░░░░░░░░  NOT FINALIZED

IMPLEMENTATION
░░░░░░░░░░░░░░░░░░░░  NOT STARTED
The next task is not to immediately build the whole website.
The next task is to finalize the screen-by-screen visual and
interaction specification, beginning with:
1. Landing / Loading
2. Hamster Intro
3. Home World
4. Main World opening
Only after those are approved should implementation begin.
41. Suggested Agent Workflow
For every future implementation request, provide the agent with:
PROJECT CONTEXT:
Read PROJECT_OVERVIEW.md first.

CURRENT PHASE:
[Phase number and name]

TASK:
[Specific task]

CONSTRAINTS:
[Anything specific to this task]

DO NOT:
[List things that must not change]

ACCEPTANCE CRITERIA:
[List measurable outcomes]

After implementation:
1. Run the project.
2. Verify the requested behavior.
3. Report files changed.
4. Report tests/build status.
5. Do not proceed to the next phase without approval.
This keeps Antigravity / Claude from turning a carefully designed
experience into one giant uncontrolled generation.
42. Canonical Product Statement
A tiny interactive indie-game birthday world built around a hamster,
where the recipient chooses between three explorable worlds --- Main,
Music, and Scrapbook --- and discovers a mixture of humor, memories,
music, wishes, an edit, and a personal letter through playful
interactions.

This sentence should remain the conceptual north star for the project.