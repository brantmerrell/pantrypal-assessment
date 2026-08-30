# PantryPal v1 — Scoping

Architecture (what shipped vs. what's deferred but planned): [diagrams.jbm.eco](https://diagrams.jbm.eco/tech/challenges/pressw/pantrypal_plan.d2?theme=light&layer=3_architecture).

## Scope committed

- TypeScript backend on the Vercel AI SDK, Dockerized, with a simple chat frontend.
- Cooking Q&A and recipe suggestions (Priya).
- A dynamic equipment/pantry check as a model-invoked tool — recipes are validated against what the user actually says they own, not a fixed assumed kit (Priya + Jordan: the #1 churn driver in beta).
- When a recipe doesn't fit what the user has, suggest a workaround or substitute instead of a flat refusal (Jordan).
- A food-adjacent topic guardrail: engage with cooking and food-adjacent asks (pairings, gear, hosting), redirect only what's clearly unrelated (Marcus).
- Allergen disclosure attached to every response that suggests a recipe or ingredient, unconditionally (Diane — non-negotiable).
- A generic redirect for health/medical mentions: acknowledge, don't adapt, point to a professional (Diane).
- In-session memory (facts stated earlier in the same conversation carry forward) — working via conversation history.
- A database for user preferences (non-health only — e.g., "vegetarian," favorite cuisines) with a working save/retrieve path. The bar for this session is proving the persistence layer is real, not deferred; automatically recalling it on every turn is not required to be complete.
- A web search tool (Tavily), invoked by the model, not hardcoded into a fixed sequence.
- SCOPING.md, README.md, TRADEOFFS.md.

## Scope cut

- **Full, automatic cross-session memory recall.** The database and schema for non-health preferences are committed above — proving the persistence layer is real — but wiring recall into every agent turn automatically is not. Health-adjacent data of any kind is never persisted, in-session or across sessions: Diane's retention story for it explicitly isn't settled ("I'd prefer v1 not store health-related mentions at all"). DB proven, full recall not yet wired, health data untouched — this split is the sharpest scope call in the build, flagged again in Risks below.
- **Opinionated personality/voice.** Marcus and Jordan both want this and call it the differentiator — but it's orthogonal to proving the system's mechanics (tool use, guardrails, memory plumbing) actually work, which is the bar for this session. Deferred rather than committed.
- **Favorites list, grocery-list export, PDF recipe import.** All three came up repeatedly with beta users (Jordan), but Jordan herself frames them as v2 in the same message.
- **Hands-free voice.** Marcus's own call ("I don't know if that's v1 — your call"). Kept a channel-adapter seam in the architecture so voice can plug in later without touching the agent core, per his ask not to architect it away.
- **Food-safety verdicts** (spoilage, "is this safe to eat"). Diane rules this out outright; Jordan's report that older users ask anyway doesn't change the answer, it's handled by the same generic redirect as health topics.
- **COPPA / under-13 handling.** Diane raised it as an open question, not a requirement — building a COPPA-compliant flow blind, with no product stance on whether under-13s are a real user segment, isn't a good use of the time box. Carried to Clarifying Questions instead of guessed at.
- **Cheap/expensive model routing.** Priya raised per-query cost, but a routing layer is real design work on top of a build that doesn't yet have latency or cost data to route on.

## Contradictions resolved

- **Response time — Priya's hard 2s SLA vs. Marcus's "quality over speed."** Resolved as a soft ~2s target, not a hard cutoff: optimize the common paths (plain Q&A, simple suggestions) for the fast feel Priya wants, and let turns that need multiple tool calls (equipment check + search) run longer rather than truncate quality, per Marcus. Revisit once real latencies are measured — neither stakeholder had that data when they wrote these asks.
- **Topic scope — Priya's "strict cooking-only" vs. Marcus's "food-adjacent, generous."** Read closely, this isn't a real conflict: Priya's line is a summary of the same goal Marcus states precisely (wine pairings, kitchen gear, hosting are in; writing someone's cover letter is out). Built to Marcus's more specific rule.
- **Health & dietary topics — Marcus's "thread the needle" vs. Diane's "non-negotiable, no medical/dietary advice."** Legal wins outright. Diane states this as explicitly product-blocking, not a preference to weigh. The product acknowledges a stated condition generically and points to a professional; it never adapts a suggestion to a medical condition. Marcus's ambition here is deferred, not built — this is the second-sharpest cut in the build, alongside deferring personality/voice (see Scope cut).

## Clarifying questions

- Is there a real under-13 user base? Diane flagged this as open, not answered — determines whether COPPA work belongs in v1.1 or never.
- What retention/deletion story does legal actually want for non-health preference data (e.g., "vegetarian," equipment owned)? Diane's email only commits to a position on health-adjacent data.
- What's an acceptable p95 latency once multi-tool turns are common in practice, now that real numbers exist, versus the ~2s figure Priya quoted from intuition?

## Assumptions made

- No real user accounts/auth in v1 — the preference database is keyed by a client-generated device identifier (stored in the browser), not a login system. That's enough to prove persistence works end-to-end; a real account system is out of scope.
- Single LLM provider/model for v1, no cost-based routing — Priya's cost concern is acknowledged but not solved; nothing here optimizes spend yet.
- General-audience product, no age gate — treated the COPPA question as unresolved-and-deferred rather than guessing at a stance.
- The allergen disclosure is a static, unconditional notice, not verified against specific ingredients or a user's stated allergies — satisfies Diane's letter ("whether or not the user mentioned allergies") without building allergen detection.

## Risks accepted

- **Cross-session memory is proven, not fully delivered.** The database exists and a save/retrieve round-trip works, but the agent doesn't yet transparently recall stored preferences on every turn the way Marcus's thesis imagines ("remembers you without you doing anything — without continuity it's just a better search engine"). Recall has to be deliberately exercised rather than happening automatically in conversation. Accepted because proving the plumbing works was the bar for this session; full transparent recall is the next step.
- **The health redirect is prompt-level behavior, not a hard filter.** It relies on the system prompt and model discipline, not a separate output classifier. An adversarial or oddly-phrased health question could still get a response that reads as advice. Accepted given the time box; flagged as the first thing to harden with more time.
- **Per-query cost is unmeasured.** Priya's ask to watch cost and route cheap-vs-smart isn't implemented. Accepted because routing needs real usage data this build doesn't have time to generate.
