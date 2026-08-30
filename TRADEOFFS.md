# PantryPal v1 — Trade-offs

## Built vs. scoped

Everything in `SCOPING.md`'s committed list shipped and is verified working, except one deliberate defer:

- **Shipped:** TS/AI SDK backend, Docker, chat frontend; cooking Q&A and recipe suggestions; the equipment-check tool (model-invoked, verified via real tool-call trace, offers a workaround instead of refusing); the food-adjacent lane guardrail (generous engagement on wine/gear/restaurants, brief redirect on genuinely unrelated asks); allergen disclosure (deterministic, appended to every response, not model-dependent); the health/medical and food-safety redirects; in-session memory (conversation history); a SQLite-backed preference store with model-invoked save/retrieve tools, verified with a real round trip across separate requests with no shared history; the Tavily web search tool.
- **Deferred:** opinionated personality/voice. Marcus and Jordan both want it and call it the differentiator, but it's orthogonal to proving the system's mechanics work, which was this session's bar. Not built at all — no partial prompt language for it either, to avoid a half-committed voice that reads as inconsistent.
- **Partial by design:** cross-session memory. The database, schema, and a working save/retrieve path are real and proven — that was the explicit bar. What's not built is automatic recall: the model can call `getPreferences`, but nothing forces it to check on every turn, so a user's stored preferences aren't guaranteed to surface unprompted the way Marcus's "remembers you" thesis imagines.

## Specific trade-offs

- **Deterministic backstops only where they were cheap and legally load-bearing.** The allergen notice (post-processing, code-level, can't be skipped) and the health-related-preference filter (keyword check before any DB write) are enforced in code, not just prompt. The health/medical redirect, food-safety redirect, and lane guardrail are prompt-only — a hard classifier for all of them was out of scope for the time available, so these rely on model discipline and were spot-checked, not exhaustively adversarially tested.
- **Unconditional allergen notice, not detection.** Per direction this session, it's appended to every `/chat` response regardless of content, rather than only when a recipe/ingredient is actually suggested. Satisfies Diane's letter ("whether or not the user mentioned allergies") without building allergen/ingredient detection — but it does mean a plain "hi" gets the notice too.
- **Equipment matching is naive substring matching**, not a fuzzy/synonym match. "Stovetop" and "stove," or "instant pot" and "pressure cooker," may not be recognized as equivalent, which could produce a false "missing" or false "owned." Chosen over a more robust matcher because the model itself does most of the real interpretation (deciding what's required, phrasing the workaround) — the tool's job is just to keep that specific check honest and deterministic, not to be a complete equipment ontology.
- **`deviceId` is client-supplied and unauthenticated.** It's enough to prove the persistence layer works, but it's spoofable — anyone who guesses or is given a `deviceId` can read those stored preferences. Accepted because there's no login system in scope at all; a real account system was never on the table for this session.
- **No preference dedup, update, or delete.** Saving "vegetarian" twice creates two rows; there's no way for a user to see or clear what's stored. This is exactly the retention/deletion story Diane flagged as needed before a real launch — proving the DB works was the bar here, not building that story out.

## What's next with more time

- Wire automatic preference recall (load stored preferences into context at the start of a conversation) rather than leaving it to the model's discretion.
- Build the personality/voice, now that the mechanics underneath it are proven.
- Replace prompt-only enforcement on the health redirect, food-safety redirect, and lane guardrail with a second-pass classifier or structured output check, matching what the allergen notice and health-preference filter already do.
- Add a real identity layer so `deviceId` can't be spoofed, plus the retention/deletion story Diane actually asked for (view/clear stored preferences).
- Instrument real latency numbers to check the resolved "soft ~2s target" against actual multi-tool-call turns — currently unmeasured.
- Smarter equipment matching (synonyms, categories) if the naive substring match turns out to misfire often in practice.
- Cost-based model routing, once there's real usage data to route on (Priya's ask, unaddressed this session).

## Known issues / unhandled cases

- The `data/` directory and SQLite file end up owned by `root` (container default), so manual cleanup needs a container-based workaround rather than plain `rm -rf`.
- CORS is currently wide open (`cors()` with no origin restriction) — fine for local/demo use, not for a real deployment with the separately-hosted frontend.
- No rate limiting or abuse handling on `/chat` — a single open endpoint.
- COPPA/under-13 handling is untouched; flagged as an open clarifying question in `SCOPING.md`, not guessed at.
- Equipment-check and lane-guardrail behavior were spot-checked with a handful of representative prompts each, not systematically adversarially tested — the assessment brief explicitly warns robustness will be exercised with inputs not designed for, and this build hasn't had a dedicated hardening pass yet.
