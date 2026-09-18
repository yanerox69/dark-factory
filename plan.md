# Dark Factory — room plan

The factory that builds the product. This plan is replaced by the product plan
once the hackathon specification is published on 26 September 2026.

## The pattern

An **assembly line with two customs posts** that can send work backwards.
Rejections always go to the implementer. Design disagreements go up to the
architect. Only product decisions reach the human.

```arch
{
  "kind": "layered",
  "title": "Dark Factory: assembly line with two customs posts",
  "layers": [
    {
      "id": "human",
      "title": "Human decision",
      "items": [
        { "id": "owner", "label": "Product owner", "detail": "Scope, behaviour, merge timing, permission approvals" }
      ]
    },
    {
      "id": "orchestration",
      "title": "Orchestration",
      "items": [
        { "id": "architect", "label": "architect", "detail": "Plans, splits work, runs the full gate, renders verdicts. Never implements." }
      ]
    },
    {
      "id": "implementation",
      "title": "Implementation",
      "items": [
        { "id": "builder", "label": "builder", "detail": "JSON API and web UI, built against the conformance checklist" }
      ]
    },
    {
      "id": "customs",
      "title": "Customs posts",
      "items": [
        { "id": "spec_warden", "label": "spec-warden", "detail": "Literal conformance: field names, status codes, error bodies, data-testid" },
        { "id": "race_hunter", "label": "race-hunter", "detail": "Atomicity, idempotency replay, malformed input, rounding, time zones" },
        { "id": "regression_guard", "label": "regression-guard", "detail": "Golden suite, full gate, baseline test count" }
      ]
    },
    {
      "id": "evidence",
      "title": "Evidence",
      "items": [
        { "id": "work_board", "label": "Work board", "detail": "Shared tasks and per-agent swim lanes" },
        { "id": "room_plan", "label": "Room plan", "detail": "Versioned plan and architecture snapshots" },
        { "id": "usage_cost", "label": "Usage and cost", "detail": "Tokens and cost per agent, for the case study" }
      ]
    }
  ],
  "flows": [
    { "from": "human", "to": "orchestration", "label": "brief and product decisions" },
    { "from": "orchestration", "to": "customs", "label": "extract conformance checklist first" },
    { "from": "orchestration", "to": "implementation", "label": "tasks with acceptance criteria" },
    { "from": "implementation", "to": "customs", "label": "handoff by commit SHA" },
    { "from": "customs", "to": "implementation", "label": "rejection: expected vs actual" },
    { "from": "customs", "to": "orchestration", "label": "verdict" },
    { "from": "orchestration", "to": "human", "label": "product decision needed" },
    { "from": "customs", "to": "evidence", "label": "verified traces" }
  ]
}
```

## The crew

| Agent | Role | Implements? |
|---|---|---|
| `architect` | Plans, splits, runs the gate, decides, renders verdicts | No |
| `spec-warden` | Literal conformance with the written specification | No |
| `builder` | JSON API and web UI | Yes |
| `race-hunter` | Concurrency, idempotency, malformed input | No |
| `regression-guard` | Golden suite and full gate | No |

One implementer, three verifiers, one planner. That ratio is deliberate: the
grading is literal and automated, so the competitive advantage is refusing to
hand off anything that does not conform — not implementing faster.

## Routing rule

Adding an agent to a room does not wake it. **Every handoff is an explicit
`@handle` mention**, written as a standalone token with no adjacent punctuation.

Handoff targets are **not** hardcoded. Each agent inspects the room participants
at handoff time and mentions whoever holds the next role. That is what makes this
a factory rather than a hardcoded pipeline: the line can be re-crewed at runtime,
and an agent can recruit missing expertise into the room and delegate to it.

## The domain: Full Pocket (wallet and payments)

A white-room clone of a Venmo-shaped product. The hard part, stated by the
organisers: **money must never be created, destroyed, or spent twice**, across
simultaneous transfers, retries and rounding.

### The invariants, in priority order

1. **Conservation.** The sum of every balance in the system is constant across
   any sequence or storm of operations. This is the master assertion: run a
   thousand concurrent random transfers, sum everything, compare to the opening
   total. One check that catches duplicated money, evaporated money, partial
   transfers and lost updates.
2. **Non-negativity.** No account balance ever goes below zero, under any
   interleaving.
3. **Exactly-once effect.** A retried request with the same idempotency key
   moves money once and returns the original stored response.

### Decisions fixed before implementation

- **Integer minor units only.** A cent is `1`, never `0.01`. No floats, no
  binary floating-point decimals anywhere near a balance. This is not a style
  preference — it is the difference between a suite that passes and one that
  drifts by a cent under load.
- **Rounding is defined once in the spec and applied at exactly one place.**
  It is a chokepoint: every path that splits or converts money funnels through
  it. Rounding logic replicated per caller will diverge.
- **The transfer is one atomic critical section.** Debit and credit commit
  together or not at all. No `await` between reading a balance and writing the
  result.
- **Durable commit before destructive step.** Record the transaction before
  clearing any hold or pending state.

### What the adversary attacks

Concurrent transfers between the same pair, circular transfers across three or
more accounts, the same idempotency key racing two different transfers,
retries arriving after a partial failure, amounts at zero, at one minor unit,
and at the maximum, and every split or fee path that could round money into or
out of existence.

## The four stages

The specification is published at kickoff. Both tracks share the same four
graded stages:

1. **JSON API** — every endpoint specified, with response formats and documented
   error codes.
2. **Web UI** — the screens the API backs, carrying the exact `data-testid`
   attribute naming each element.
3. **Concurrency control** — on every write path: atomic check-and-act,
   idempotency keys returning the original response, malformed input answered
   with the documented error instead of a 500.
4. **Domain extension** — a real extension of the same domain, extending the
   model and API already built, breaking nothing that already works.

## Done state

A stage is done when, and only when:

- `spec-warden` reports CONFORMS on every checklist item
- `race-hunter` reports a clean sweep, with the tests that prove it
- `regression-guard` reports the full gate green and the test count at or above
  baseline
- `architect` renders APPROVED with an adversarial sweep attached

## Declared limitation

An agent cannot approve another agent's permission request, and Jam offers no
bulk approval. Operations that trigger a permission request therefore require a
human. **This factory is not fully autonomous, and claiming otherwise would be
false.** Agent approval defaults are set so routine file creation and deletion
need no approval; what remains are genuine exceptions, and those are answered by
the human.
