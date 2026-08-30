# PantryPal v1 — Scoping

## Scope committed

- TypeScript backend on the Vercel AI SDK, Dockerized, with a simple chat frontend.
- Cooking Q&A and recipe suggestions (Priya).
- A dynamic equipment/pantry check as a model-invoked tool — recipes are validated against what the user actually says they own, not a fixed assumed kit (Priya + Jordan: the #1 churn driver in beta).
- When a recipe doesn't fit what the user has, suggest a workaround or substitute instead of a flat refusal (Jordan).
- A food-adjacent topic guardrail: engage with cooking and food-adjacent asks (pairings, gear, hosting), redirect only what's clearly unrelated (Marcus).
- Allergen disclosure attached to every response that suggests a recipe or ingredient, unconditionally (Diane — non-negotiable).
- A generic redirect for health/medical mentions: acknowledge, don't adapt, point to a professional (Diane).
- In-session memory (facts stated earlier in the same conversation carry forward) — not durable, not stored across sessions.
- A web search tool (Tavily), invoked by the model, not hardcoded into a fixed sequence.
- An opinionated response voice — real takes, not hedge-everything chatbot tone (Marcus + Jordan, both independently flagged this as the differentiator).
- SCOPING.md, README.md, TRADEOFFS.md.

## Scope cut

- **Durable cross-session memory.** Marcus's single strongest ask, cut anyway: it needs a retention/deletion story Diane explicitly says isn't settled ("I'd prefer v1 not store health-related mentions at all"), and general preference storage still deserves the same rigor in the time we have. In-session memory ships instead; this is the sharpest scope call in the whole build and it's flagged again in Contradictions and Risks below.
- **Favorites list, grocery-list export, PDF recipe import.** All three came up repeatedly with beta users (Jordan), but Jordan herself frames them as v2 in the same message.
- **Hands-free voice.** Marcus's own call ("I don't know if that's v1 — your call"). Kept a channel-adapter seam in the architecture so voice can plug in later without touching the agent core, per his ask not to architect it away.
- **Food-safety verdicts** (spoilage, "is this safe to eat"). Diane rules this out outright; Jordan's report that older users ask anyway doesn't change the answer, it's handled by the same generic redirect as health topics.
- **COPPA / under-13 handling.** Diane raised it as an open question, not a requirement — building a COPPA-compliant flow blind, with no product stance on whether under-13s are a real user segment, isn't a good use of the time box. Carried to Clarifying Questions instead of guessed at.
- **Cheap/expensive model routing.** Priya raised per-query cost, but a routing layer is real design work on top of a build that doesn't yet have latency or cost data to route on.

## Contradictions resolved

- **Response time — Priya's hard 2s SLA vs. Marcus's "quality over speed."** Resolved as a soft ~2s target, not a hard cutoff: optimize the common paths (plain Q&A, simple suggestions) for the fast feel Priya wants, and let turns that need multiple tool calls (equipment check + search) run longer rather than truncate quality, per Marcus. Revisit once real latencies are measured — neither stakeholder had that data when they wrote these asks.
- **Topic scope — Priya's "strict cooking-only" vs. Marcus's "food-adjacent, generous."** Read closely, this isn't a real conflict: Priya's line is a summary of the same goal Marcus states precisely (wine pairings, kitchen gear, hosting are in; writing someone's cover letter is out). Built to Marcus's more specific rule.
- **Health & dietary topics — Marcus's "thread the needle" vs. Diane's "non-negotiable, no medical/dietary advice."** Legal wins outright. Diane states this as explicitly product-blocking, not a preference to weigh. The product acknowledges a stated condition generically and points to a professional; it never adapts a suggestion to a medical condition. Marcus's ambition here is deferred, not built — this is the second-sharpest cut in the build, alongside cross-session memory.

## Clarifying questions

- Is there a real under-13 user base? Diane flagged this as open, not answered — determines whether COPPA work belongs in v1.1 or never.
- What retention/deletion story does legal actually want for non-health preference data (e.g., "vegetarian," equipment owned)? Diane's email only commits to a position on health-adjacent data.
- What's an acceptable p95 latency once multi-tool turns are common in practice, now that real numbers exist, versus the ~2s figure Priya quoted from intuition?

## Assumptions made

- No user accounts/auth in v1 — "memory" means within one conversation's context, not tied to a durable identity. Durable memory was cut, so an auth system to hang it on wasn't built either.
- Single LLM provider/model for v1, no cost-based routing — Priya's cost concern is acknowledged but not solved; nothing here optimizes spend yet.
- General-audience product, no age gate — treated the COPPA question as unresolved-and-deferred rather than guessing at a stance.
- The allergen disclosure is a static, unconditional notice, not verified against specific ingredients or a user's stated allergies — satisfies Diane's letter ("whether or not the user mentioned allergies") without building allergen detection.

## Risks accepted

- **The product doesn't deliver Marcus's core thesis.** He's explicit that memory *is* the product ("without continuity it's just a better search engine"). Shipping in-session-only memory means the highest-conviction stakeholder ask is the one most visibly absent from the demo. Accepted because it's the one place product ambition and legal's non-negotiable retention concerns collide directly, and resolving that properly is not a 3-hour decision.
- **The health redirect is prompt-level behavior, not a hard filter.** It relies on the system prompt and model discipline, not a separate output classifier. An adversarial or oddly-phrased health question could still get a response that reads as advice. Accepted given the time box; flagged as the first thing to harden with more time.
- **Per-query cost is unmeasured.** Priya's ask to watch cost and route cheap-vs-smart isn't implemented. Accepted because routing needs real usage data this build doesn't have time to generate.
