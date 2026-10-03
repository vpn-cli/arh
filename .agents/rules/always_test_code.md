# Mandatory Testing Rule

**CRITICAL DIRECTIVE:** You MUST run tests before presenting any modified code to the user.

## Context
The user has experienced repeated frustration when code was provided that broke the build or introduced runtime errors due to unvalidated changes (e.g., failing to destructure React props). To ensure this never happens again, follow this checklist unconditionally.

## Checklist Before Ending Turn
Every time you modify code (especially `.tsx`, `.ts`, or `.js` files), you must perform the following validation steps BEFORE concluding your response:

1. **Run the Test Suite:**
   Execute `npx vitest run` via the `run_command` tool.
   *Do not proceed unless all tests pass. If tests fail, fix the code and re-run until green.*

2. **Verify Build Integrity:**
   If you have modified core configurations or performed complex refactoring, consider running `npm run build` or checking the Next.js dev server output to ensure the application still compiles.

3. **Acknowledge the Test Execution:**
   When responding to the user, briefly mention that you have successfully run and passed the tests to reassure them that the code is stable.

**NEVER skip these steps, even if the change seems trivial or you are rushing to deliver a debug fix.**
