# Textos de la entrega

Todo listo para copiar en el formulario de lablab.ai. **En inglés**, porque los
jueces son internacionales.

Reescrito el 28-09-2026 contra lo que de verdad se entregó. La versión anterior
de este fichero describía la banda de cinco agentes (`architect`, `spec-warden`,
`builder`, `race-hunter`, `regression-guard`) sobre Claude Code y OpenRouter, con
demo en Vercel. Nada de eso llegó a existir: el run juzgado son **tres asientos**
sobre **OpenCode + Featherless**, y el producto es una **API en Go sin interfaz**.

**Repositorio de la entrega:** https://github.com/yanerox69/dark-factory-pocketful

---

## Título

```
Dark Factory — a coding-agent band built to refuse its own work
```

Alternativa más descriptiva si el formulario premia la claridad sobre el gancho:

```
Dark Factory: three coding agents building a payments API in one BAND room
```

---

## Descripción corta

Para la tarjeta del listado. Respeta el límite de caracteres del formulario.

```
Three coding agents in one BAND room build a payments API against a written
specification. Two of the three are forbidden from writing code — their only
job is to refuse handoffs that do not conform.
```

*(186 caracteres)*

---

## Descripción larga

```
Dark Factory is a software factory built in BAND Desktop: three coding-agent
seats sharing one room, coordinating entirely through @mention routing,
building a wallet and payments service against a written specification.

THE DESIGN DECISION

Grading for this challenge is literal and automated — exact field names, exact
status codes, exact error codes. A correct-looking service with one mistyped
attribute scores nothing. So the competitive advantage is not implementing
faster; it is refusing to hand off anything that does not conform.

That shaped the crew ratio. One implementer, one verifier, one planner who also
holds the gate. Two of the three seats are forbidden from writing production
code:

- coordinator — plans, splits the work, routes spec ambiguities, runs the gate
- implementer — the Go service, the Dockerfile, the tests. The only seat that
  writes
- reviewer — conformance against the specification text, never against the
  implementer's report

All three run the same harness and the same model: OpenCode against Featherless
AI, model zai-org/GLM-5.2. Nothing here comes from giving a role a better
model. The only difference between the seats is the mandate file, which the
runner loads as that seat's system prompt — so the mandate is not
documentation, it is the seat.

HOW WORK MOVES

Adding a seat to a room does not wake it; a message must mention it. So every
handoff is an explicit @mention, and that is the wiring.

Handoff targets are never hardcoded. Each mandate tells the seat to inspect the
room participants at handoff time and mention whoever holds the next role. The
line can be re-crewed at runtime without editing a mandate.

Rejections travel backwards, and one deviation rejects the whole handoff.

WHAT THE FACTORY CAUGHT

Before any code existed, the reviewer turned the specification into a 158-item
numbered conformance checklist — derived from the spec text only, deliberately
not from the shipped test suite. The package ships 79% of stage 1's checks and
the graded run uses 100%, so a checklist transcribed from the tests encodes the
sample's blind spots as the requirement. The reviewer flagged 22 items as
spec-only: requirements no shipped test would have caught.

Then one seat corrected another. The coordinator resolved an ambiguity about
what an empty request body means, recommending it be treated as an empty
object. The reviewer confirmed the reading and rejected it as incomplete: the
canonical STORED body for idempotency comparison must also be the empty object,
or a legitimate retry reads as a key reuse. The coordinator had answered what
the endpoint should accept; the reviewer caught that it was silently wrong
about what the endpoint should store. Both caveats became binding numbered
items in the contract, acknowledged by the implementer four minutes later,
before a line of code was written.

Two of those items were structural, and both are checkable in the shipped
binary today: no float64 anywhere on the money path (zero matches across all 23
Go files), and every money movement through a single chokepoint under the mutex
(applyDelta, declared once, three call sites, all in one file — a settlement
checks every wallet's net position first, then applies, all or none).

WHAT IT DID NOT CATCH

The reviewer was stopped partway through the run to conserve budget, and never
ran the verification pass it had committed to. Two defects shipped past the
seats: exported empty collections marshalled as null instead of an empty array,
and a password hash that was base64 on export but read as raw text on import —
which meant nobody could log in after an import. The owner caught both by
running the gate independently. The structural properties above hold, but they
hold because the implementer built to the contract, not because anyone verified
it at the handoff.

MEASURED

3 hours 49 minutes, one session, no restarts. 451 messages carrying 206 tool
calls. 11,743,469 tokens across 13 reported turns — 11,530,554 in, 212,915 out.
$11.70 of a $25 Featherless credit. Result: 147 of 147 shipped checks, claimed
stage 1, run in isolated mode.

Input outweighed output 54 to 1. That ratio is the real economics of a room: a
seat re-reads the accumulated room on every turn, so a factory costs what its
own history costs, not what it produces. The implementer spent 9.1 million
input tokens to emit 75 thousand. It is also why switching two seats off was
the lever that let the run finish inside the credit.

Every one of these figures comes from the room log that ships in the
repository, not from a provider dashboard.

THE DELETE TEST

Take BAND out and this factory does not degrade — it disappears. The rejection
has no channel: a bounce is a message that wakes one specific seat. The
contract has nowhere to live: the 158-item checklist was published to the room
and read by the seat that did not write it. The work board is not a log: 17
tasks, claimed and closed by the seats themselves. And the human stops being a
peer in the same room as the work — outside it, every correction is a restart
with no memory of what was already agreed.

THE LIMITATION WE DECLARE

The seats run with approvals accepted automatically. That is what makes the run
unattended, and it means a seat executes commands in its working directory
without asking anyone. The blast radius is the working directory, which is why
the result repository is separate from everything else and why credentials live
outside it.

The honest limit is not permissions, it is judgment. A seat that reports work
it did not do will be believed by the other seats unless one of them checks. We
hit this twice, and neither seat lied — both reported what they believed.

And the run was not unattended. It took six human messages: one kickoff and
five corrections. Three of those five are now standing sections in the
mandates, because a correction the owner has to give twice is a missing
mandate. The verifier is the only part of this factory that was optional, and
it is the part that was cut. The result passes 147 of 147, and we cannot claim
the factory is why.
```

---

## Tags

**Tecnología:**
```
BAND, OpenCode, Featherless AI, GLM-5.2, Go, Docker, multi-agent, agentic coding
```

**Categoría:**
```
Developer Tools, Multi-Agent Systems, Autonomous Software Engineering
```

---

## Slides en PDF

✅ **Hecho:** 15 diapositivas, con notas del ponente.

https://claude.ai/artifact/XdwuYSEbNLzw36ubYSFNYh

Hay dos formas de tener el PDF, y ambas valen:

**1. Desde la propia página** — **Share › Export**. Es la vía buena: usa el
renderizador real del deck. El deck es privado hasta que lo compartas desde ese
mismo menú.

**2. [`deck.pdf`](deck.pdf) en la raíz de este repo.** Reconstruido el
28-09-2026 desde el HTML de las diapositivas con Chrome en headless. 15 páginas
a 20×11,25 pulgadas, que es 16:9 exacto.

⚠️ Si se regenera, dos cosas que cuestan un rato descubrir:

- **`@page` en píxeles no funciona.** Chrome ignora `size: 1920px 1080px` y deja
  bandas del color del fondo a la derecha y abajo. Hay que darlo en pulgadas:
  `size: 20in 11.25in`.
- **Los márgenes por defecto de Chrome cortan texto.** El visor de diapositivas
  anula los de `h1`, `p` y `table`; Chrome no. Sin un `margin:0` explícito, la
  última línea de cada columna se pierde por debajo del borde.
- Los `<x-connector>` del diagrama de enrutamiento no existen fuera del visor.
  El fichero de impresión lleva un polyfill que los convierte en divs rotados
  con una punta de flecha en CSS.

El `deck.pdf` anterior —el del 19 de septiembre, con la banda de cinco agentes—
se borró ese mismo día. Un PDF obsoleto en la raíz es justo lo que se sube por
error el día de la entrega.

---

## Imagen de portada (16:9)

✅ **Rehecha:** [`web/cover.png`](web/cover.png) — 1280×720, ratio 1.7778 exacto.

Actualizada a los tres asientos reales y al stack real (`BAND · OpenCode ·
GLM-5.2 · Go · MIT`). El criterio no cambia: en el listado esto se ve en
miniatura, así que solo puede leerse **una** cosa, y esa cosa es la **flecha de
retorno** en ámbar — el rebote es el argumento entero del proyecto.

Sin caras, sin robots, sin cerebros de circuitos.

### Regenerarla

La fuente es [`web/cover.html`](web/cover.html):

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,720 --virtual-time-budget=10000 --screenshot="web\cover.png" "file:///C:/Users/Yanero/Desktop/dark-factory/web/cover.html"
```

⚠️ Dos trampas, las dos verificadas el 28-09-2026:

- `--virtual-time-budget` es necesario: sin él Chrome captura antes de que
  carguen las fuentes de Google y la portada sale con tipografía de sistema.
- **Chrome cachea la página `file://`.** Si editas el HTML y vuelves a lanzar el
  comando, puede escribirte el PNG anterior con un `LastWriteTime` nuevo, que es
  justo lo que engaña. Renderiza a una ruta temporal, míralo, y solo entonces
  cópialo sobre `web/cover.png`.

---

## Demo desplegada — no hace falta

El reglamento genérico de lablab.ai pide una URL de demo funcional en Vercel,
Streamlit o Replit. **No aplica a esta pista.**

La guía del participante se declara autoritativa (*"This guide is the
authoritative rules and instructions for participants"*) y lo que enumera como
requisito de elegibilidad es:

> *"A submitted presentation, video and public GitHub repository as specified
> below."*

Los cuatro gates son el roster de asientos, el log de sala con `@handle` en
ambas direcciones, que `stage-1/` arranque en un contenedor limpio siguiendo su
`RUN.md`, y que los mandatos sean genéricos. **Ninguno menciona un despliegue.**
Los jueces construyen el `Dockerfile` y hablan con el contenedor por HTTP.

Además, `stage-1` de pocketful es una API JSON sin interfaz: la UI es el
stage 2, que no construimos. No hay nada que desplegar en Vercel.

---

## Checklist del formulario

- [ ] Título
- [ ] Descripción corta
- [ ] Descripción larga
- [ ] Tags de tecnología y categoría
- [x] Portada PNG **16:9** — `web/cover.png`
- [ ] Vídeo MP4, **menos de 5 min, máx. 300 MB** — **debe mostrar la sala de BAND**
- [x] Slides en **PDF** — exportar desde el deck
- [x] Repositorio GitHub **público** con licencia **MIT**
- [x] ~~URL de demo funcional~~ — no aplica a esta pista, ver arriba

---

## ⚠️ Lo que la rúbrica va a penalizar en este run

Conviene saberlo antes de enviar, no después. El criterio **Agent Teamwork**
vale el 25% y tiene dos mitades:

> *"**Autonomy:** in the run you submit, the task you dispatch for each stage is
> the only human input — **no steering, approvals, debugging hints or reruns**
> until it passed."*

El run entregado tiene **cinco mensajes de dirección** además del arranque. Eso
incumple la mitad de autonomía tal y como está escrita.

> *"**Collaboration:** the seats really shared the work — more than one seat did
> it, review changed something..."*

Aquí vamos mejor: la revisión **sí** cambió algo y está trazado. Pero el
implementer escribió el 68% de los mensajes y el reviewer el 6%, y la guía avisa
de que *"one seat carrying 90% of it looks the same"*.

Y el criterio **App** (25%) mide la UI del stage 2, que no existe.

**La decisión:** con el saldo restante (~$13.30, aproximadamente un run) se puede
intentar un run limpio sin dirección humana, que es exactamente lo que la
rúbrica premia. El riesgo es quedarse sin saldo y sin entrega mejor. Lo que sí
está hecho es declararlo todo en `FACTORY.md` y en la descripción larga: un
jurado que lo lea en el log y no en nuestra memoria descriptiva puntúa peor.
