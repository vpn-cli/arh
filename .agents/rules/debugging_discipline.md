# Debugging Discipline Rulebook

**CRITICAL DIRECTIVE:** Follow these rules unconditionally during any debugging or investigation session. Violating them wastes the user's time and destroys trust.

---

## The Incident That Created This Rule

During the scrapbook save/persistence debugging session, the following mistakes were made that wasted significant user time:

1. A debug logger was written to search for a specific image (`WA0005`) on the **right page**, but the image was actually on the **left page**. This caused the logger to print `undefined`, making it appear as if the save was broken.
2. The agent spent multiple turns asking the user to test things, only to discover the logger itself was the broken piece — not the actual save logic.
3. The actual persistence bug (Next.js caching) was fixed early, but the broken debug code masked this fact, causing unnecessary additional investigation rounds.

**Root cause: The agent added debug code that was never verified to actually point at the correct data before asking the user to run tests.**

---

## Rules

### Rule 1: Verify Debug Code Against Real Data Before Asking the User to Test

Before adding any debug logger, trace, or probe:
- **Read the actual data first** using `view_file` or a `run_command` to inspect the JSON/state.
- Confirm the exact field path, array index, and value exist in the real data.
- Only then write the debug code, using the verified path.
- **NEVER write a debug logger that targets a hardcoded string (e.g., a filename) without first confirming that string exists in the data.**

### Rule 2: Do Not Blame the Feature When the Debug Code Is Unverified

If a debug log says `undefined`, check:
1. Does the data structure actually contain what the logger is looking for? (**Check the data first.**)
2. Is the array index/spread index correct?
3. Is the field name spelled correctly?

**Do not ask the user to run more tests until you have verified the debug code itself is correct.**

### Rule 3: One Hypothesis Per Turn

Do not layer multiple unverified hypotheses on top of each other. Pick the single most likely cause, implement one targeted fix or probe, verify it, then report findings.

**Never add three different fixes in the same turn without explaining exactly what each one does and what evidence it will produce.**

### Rule 4: Read the File Before Writing a Fix

Before writing any fix that touches data (JSON files, API routes, state shape):
- Use `view_file` or `run_command` to inspect the actual current state of the data.
- Confirm the structure matches what your fix assumes.

### Rule 5: Tell the User What to Expect, Not Just What You Did

When asking the user to perform a test step:
- State the **exact log message** they should see if the fix worked.
- State the **exact log message** they should see if it did not work.
- Do not ask vague questions like "what does the log say?" — give them a specific expectation to compare against.

### Rule 6: Admit Mistakes Immediately and Concisely

When a mistake is found:
- Acknowledge it in one sentence.
- Explain the root cause in one sentence.
- State the fix in one sentence.
- **Do not over-explain or over-apologize. Just fix it.**

### Rule 7: Clean Up All Debug Code After the Issue Is Resolved

Once a bug is confirmed fixed:
- Remove ALL debug overlays, console logs, and temporary UI elements in the same turn.
- Do not leave debug artifacts in production code.
- Verify the cleanup compiles before ending the turn.

---

## Quick Checklist Before Adding Any Debug Code

- [ ] I have read the actual data and confirmed the field/path exists
- [ ] My debug code targets the correct array index and side (left/right/etc.)
- [ ] I have told the user what exact output to expect if it works vs. fails
- [ ] I have NOT added more than one fix/probe in this turn
- [ ] I will clean up this debug code once the issue is confirmed resolved
