# Dark Factory — Full Pocket

A software factory built in [BAND](https://band.ai) Desktop: five coding agents
sharing one room, coordinating entirely through `@mention` routing, building a
wallet and payments service against a written specification.

Entry for **WeAreDevelopers × BAND — Dark Factory**, track: Full Pocket.
Licence: MIT.

**Live:** https://dark-factory-sepia.vercel.app

---

## The design decision

Grading for this challenge is literal and automated — exact field names, exact
status codes, exact `data-testid` values. A beautiful screen with a mistyped
attribute scores zero.

So the competitive advantage is not implementing faster. It is **refusing to
hand off anything that does not conform**. That shaped the crew ratio: four of
the five agents are forbidden from writing production code.

| Agent | Role | Writes code |
|---|---|---|
| [`architect`](roles/architect.md) | Plans, splits the work, runs the full gate, renders verdicts | No |
| [`spec-warden`](roles/spec-warden.md) | Literal conformance with the specification | No |
| [`builder`](roles/builder.md) | The JSON API and the web UI | **Yes** |
| [`race-hunter`](roles/race-hunter.md) | Concurrency, idempotency, malformed input | No |
| [`regression-guard`](roles/regression-guard.md) | Golden suite and baseline test count | No |

## How work moves

Adding an agent to a room does not wake it — a message must mention it. So every
handoff is an explicit `@mention`, and that is the wiring.

Handoff targets are **never hardcoded**. Each role instructs the agent to inspect
the room participants at handoff time and mention whoever holds the next role.
The line can be re-crewed at runtime, and an agent that finds the expertise
missing can recruit another agent into the room and delegate to it.

Rejections travel backwards: any customs post can bounce work to the builder with
expected-versus-actual. One deviation rejects the whole handoff.

The full design, including the mention graph and the delete test, is in
[`banda/00-diseno-banda.md`](banda/00-diseno-banda.md) (Spanish).

## The product

Full Pocket, a wallet and payments clone. Money must never be created, destroyed,
or spent twice. Three invariants carry it:

1. **Conservation** — the sum of every balance is constant across any storm of
   operations. One assertion catches duplicated money, evaporated money, partial
   transfers and lost updates.
2. **Non-negativity** — no balance goes below zero under any interleaving.
3. **Exactly-once effect** — a retry with the same idempotency key moves money
   once and returns the original stored response.

Integer minor units only, and rounding in exactly one function: replicated
rounding diverges, and divergent rounding is money created.

Invariants and fixed decisions: [`plan.md`](plan.md).

## Repository layout

| Path | What it is |
|---|---|
| [`roles/`](roles/) | The persistent role instructions each agent carries |
| [`plan.md`](plan.md) · [`architecture.json`](architecture.json) | The room plan and its Arch diagram |
| [`banda/`](banda/) | The band design and the mention graph |
| [`ENTREGA.md`](ENTREGA.md) · [`GUION-VIDEO.md`](GUION-VIDEO.md) | Submission copy and the video script |
| [`web/`](web/) | A page explaining the factory |
| [`dry-run/`](dry-run/) | **A rehearsal, not a deliverable** — see below |

## About `dry-run/`

`dry-run/` is a **seat reservation service** — a different domain from the
competition track — that the agent band built end to end from a one-paragraph
brief on **18 September 2026, before the build window opened**, purely to
rehearse the pipeline.

87 tests, 87 passing, run independently rather than taken from the agents' own
report. It is evidence that the factory works. It is **not** hackathon output and
shares no code with the Full Pocket product.

Three behaviours emerged during that rehearsal that were never written into the
brief:

- The race-hunter raised a race, disproved it, and retracted it in the open —
  recorded by the architect as *"the honest RH-5 ghost withdrawal"*.
- The race-hunter corrected its supervisor on a factual detail before it was baked
  into the gate: *"the count is now 87, not 83."* It was right.
- The architect signed off the atomicity chokepoint by file and line
  (`store.js:54/75`) rather than accepting the builder's summary.

A pipeline cannot retract its own finding or correct the stage above it.

## The limitation we declare

This factory is **not fully dark**. An agent cannot approve another agent's
permission request, and there is no bulk approval, so operations that trigger one
require a human. Approval policies are set so routine file work needs none; what
remains are genuine exceptions, and those get a person. Claiming otherwise would
be false.

## Running it

- [`FABRICA.md`](FABRICA.md) — agent and room setup, and the commands
- [`OPENROUTER.md`](OPENROUTER.md) — inference configuration
- [`MODO-TERMINAL.md`](MODO-TERMINAL.md) — the no-API-cost fallback
- [`PREPARACION.md`](PREPARACION.md) — the preparation kit index (Spanish)

Built on BAND · Jam · Claude Code · OpenRouter · Node.js
