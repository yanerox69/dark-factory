# Textos de la entrega

Todo listo para copiar en el formulario de lablab.ai. **En inglés**, porque los
jueces son internacionales.

Los `[corchetes]` son huecos que se rellenan al final del build.

---

## Título

```
Dark Factory — the band that refuses its own work
```

Alternativa más sobria si el formulario penaliza los guiones largos:

```
Dark Factory: a coding agent band with two customs posts
```

---

## Descripción corta

Para la tarjeta del listado. Respeta el límite de caracteres del formulario.

```
A band of coding agents that plans, implements and verifies a payments API —
where four of the five agents are forbidden from writing code, and one
deviation from the spec rejects the whole handoff.
```

*(186 caracteres)*

---

## Descripción larga

```
Dark Factory is a software factory built in BAND Desktop: five coding agents
sharing one room, coordinating entirely through @mention routing, building a
wallet and payments service against a written specification.

THE DESIGN DECISION

The grading for this challenge is literal and automated — exact field names,
exact status codes, exact data-testid values. A beautiful screen with a
mistyped attribute scores zero. So the competitive advantage is not
implementing faster; it is refusing to hand off anything that does not
conform.

That shaped the crew ratio. One implementer, three verifiers, one planner.
Four of the five agents are forbidden from writing production code:

- architect — plans, splits the work, runs the full gate, renders verdicts
- spec-warden — literal conformance with the written specification
- builder — the JSON API and the web UI
- race-hunter — concurrency, idempotency replay, malformed input
- regression-guard — the golden suite and the baseline test count

HOW WORK MOVES

Adding an agent to a room does not wake it; a message must mention it. So
every handoff is an explicit @mention, and that is the wiring.

Crucially, handoff targets are never hardcoded. Each role instructs the agent
to inspect the room participants at handoff time and mention whoever holds the
next role. The line can be re-crewed at runtime, and an agent that finds the
expertise missing can recruit another agent into the room and delegate to it.

Rejections travel backwards. Any customs post can bounce work to the builder
with expected-versus-actual. One deviation rejects the whole handoff.

WHAT IT PRODUCED

Before the build window opened, the band built a reservation service end to
end from a one-paragraph brief, as a pipeline rehearsal. 87 tests, 87 passing
— run independently rather than taken from the agents' own report, since the
whole design rests on not trusting reports.

Three behaviours emerged that were never written into the brief:

- The race-hunter raised a race, disproved it, and retracted it in the open.
  The architect recorded it as "the honest RH-5 ghost withdrawal".
- The race-hunter corrected its supervisor on a factual detail before it was
  baked into the gate: "the count is now 87, not 83." It was right.
- The architect signed off the atomicity chokepoint by file and line rather
  than accepting the builder's summary.

A pipeline cannot retract its own finding or correct the stage above it.

THE PRODUCT

Full Pocket, a wallet and payments clone. Money must never be created,
destroyed, or spent twice. Three invariants carry it: conservation (the sum of
all balances is constant across any storm of operations), non-negativity under
every interleaving, and exactly-once effect on idempotency replay. Integer
minor units only, and rounding in exactly one function — replicated rounding
diverges, and divergent rounding is money created.

[__ conformance items, __ tests, __ bounces before the gate went green.]

THE DELETE TEST

Take BAND out and the factory does not degrade — it disappears. The bounce has
no channel. Runtime recruitment has no registry. The work board, versioned
plan and mirrored traces that constitute the verified result have nowhere to
live. And the human stops being a peer in the same room as the work.

THE LIMITATION WE DECLARE

This factory is not fully dark. An agent cannot approve another agent's
permission request, and there is no bulk approval, so operations that trigger
one require a human. Approval policies are set so routine file work needs no
human; what remains are genuine exceptions, and those get a person. Claiming
otherwise would be false.
```

---

## Tags

**Tecnología:**
```
BAND, Jam, Claude Code, OpenRouter, Node.js, multi-agent, agentic coding
```

**Categoría:**
```
Developer Tools, Multi-Agent Systems, Autonomous Software Engineering
```

---

## Imagen de portada (16:9)

Concepto, para generar o montar:

> Fondo casi negro (`#0E1116`). Cinco nodos en línea horizontal unidos por
> flechas, con **una flecha de retorno curvada** desde los tres últimos hacia el
> tercero — el rebote, que es lo que distingue el sistema. Cuatro nodos en verde
> (`#3FB950`), el `builder` en ámbar (`#D29922`). Debajo, en mono:
> `architect → spec-warden → builder → customs`. Título en IBM Plex Sans:
> **Dark Factory**. Sin caras, sin robots, sin cerebros de circuitos.

El elemento que tiene que leerse en miniatura es **la flecha de retorno**.

---

## Checklist del formulario

- [ ] Título
- [ ] Descripción corta
- [ ] Descripción larga
- [ ] Tags de tecnología y categoría
- [ ] Portada PNG/JPG **16:9**
- [ ] Vídeo MP4, **menos de 5 min, máx. 300 MB**
- [ ] Slides en **PDF**
- [ ] Repositorio GitHub **público** con licencia **MIT**
- [ ] URL de demo funcional (Vercel)

---

## README del repositorio

Para la raíz del repo público. Los jueces suelen abrirlo antes que nada.

```markdown
# Dark Factory — Full Pocket

A software factory built in BAND Desktop: five coding agents in one room,
coordinating through @mention routing, building a wallet and payments service
against a written specification.

**Live demo:** [...]  ·  **Deck:** [...]  ·  Licence: MIT

## The idea

Grading for this challenge is literal and automated. So the advantage is not
implementing faster — it is refusing to hand off anything that does not
conform. Four of the five agents are forbidden from writing production code.

| Agent | Role | Writes code |
|---|---|---|
| `architect` | Plans, splits, runs the full gate, renders verdicts | No |
| `spec-warden` | Literal conformance with the specification | No |
| `builder` | The JSON API and the web UI | **Yes** |
| `race-hunter` | Concurrency, idempotency, malformed input | No |
| `regression-guard` | Golden suite and baseline test count | No |

## How work moves

Adding an agent to a room does not wake it — a message must mention it. Every
handoff is an explicit `@mention`, and handoff targets are never hardcoded:
each agent inspects the room at handoff time and mentions whoever holds the
next role.

Rejections travel backwards. One deviation rejects the whole handoff.

## Repository layout

| Path | What it is |
|---|---|
| `roles/` | The persistent role instructions each agent carries |
| `plan.md`, `architecture.json` | The room plan and its Arch diagram |
| `banda/` | The band design and the mention graph |
| `dry-run/` | A rehearsal service the band built end to end. 87 tests, 87 passing. Evidence the factory works — not a hackathon deliverable |

## Running it

See `FABRICA.md` for the agent and room setup, and `OPENROUTER.md` for the
inference configuration.
```
