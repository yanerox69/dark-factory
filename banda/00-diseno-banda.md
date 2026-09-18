# Diseño de la banda

## El patrón: línea de montaje con dos aduanas

La guía de hackers de BAND dice: *"elige primero un patrón de colaboración, luego
el dominio"*. El nuestro es una **línea de montaje** (assembly line) con dos
puestos de control que pueden **devolver** el trabajo hacia atrás.

No es una cadena lineal. Es una cadena con rebote:

```
Humano ──brief──▶ architect
                     │
                     ├──▶ spec-warden   (extrae la lista de conformidad ANTES de implementar)
                     │         │
                     │         ▼
                     └──▶ builder ──▶ spec-warden ──▶ race-hunter ──▶ regression-guard
                                           │               │                  │
                                           └───rechazo─────┴──────────────────┘
                                                      ▼
                                                   builder
```

Los rechazos van siempre al `builder`. Los desacuerdos de diseño suben al
`architect`. Solo las decisiones de producto llegan al humano.

---

## Por qué esta banda y no otra

El hackathon publica una **especificación escrita** el día de inicio, y las cuatro
etapas piden:

1. API JSON con formatos de respuesta y **códigos de error documentados**
2. UI web con el atributo **`data-testid` exacto**
3. Control de concurrencia: atomicidad, claves de idempotencia, errores
   documentados en vez de 500
4. Extensión de dominio **sin romper lo que ya funciona**

Ese nivel de literalidad (`data-testid` exacto, códigos de error documentados,
"el error documentado en lugar de un 500") indica **evaluación automatizada por
conformidad**, no por demo bonita. Una pantalla preciosa con el testid mal
escrito puntúa cero.

Por eso la banda tiene **dos verificadores distintos y un guardián**, y solo un
implementador. La ventaja competitiva no está en implementar más rápido: está en
**no entregar nada que no cumpla literalmente**.

---

## Los cinco agentes

### 1. `architect` — planifica, revisa, decide

**Skill:** `band-peer:architect` (ya instalado)
**Nunca implementa.** Es el único que habla con el humano.

Sus dos reglas cardinales vienen del skill:

> **"Verify, don't trust"** — un informe ("listo, todo verde") es una afirmación,
> no evidencia; reprodúcelo.
> **"Attack, don't just approve"** — genera la lista de amenazas que el
> desarrollador no hizo.

Responsabilidades:
- Lee la especificación publicada y escribe `plan.md` + `architecture.json`
- Trocea el trabajo en tareas compartidas del tablero
- Ejecuta el **gate completo** él mismo antes de cualquier aprobación
- Emite veredicto por ítem: APROBADO / aprobado-con-seguimiento / bloqueado-porque-X
- Mantiene su propia lista de ítems abiertos entre rondas
- Escala al humano **solo** decisiones de producto

### 2. `spec-warden` — conformidad literal

**Sin skill predefinido.** Es el agente diferencial: no existe de serie.
**Nunca implementa.**

Es el que gana el hackathon. Su único trabajo es convertir la especificación en
una **lista de conformidad comprobable a máquina** y rechazar todo lo que se
desvíe un carácter:

- Cada endpoint, método y ruta
- Cada nombre de campo de petición y respuesta, tal cual está escrito
- Cada código HTTP
- Cada cuerpo de error documentado
- Cada `data-testid`, carácter por carácter

**Actúa antes y después de implementar.** Antes: extrae la checklist de la spec
para que el `builder` sepa contra qué construir. Después: verifica.

Regla de oro del rol: *"la especificación manda sobre el buen gusto"*. Si la spec
dice `error_code` y el builder escribió `errorCode`, es un rechazo, no un detalle.

### 3. `builder` — implementa

**Skill:** `band-peer:full-stack-developer` (ya instalado)

Implementa API y UI contra la checklist de conformidad, no contra su
interpretación de la spec. Mantiene sus tareas privadas al día (en Claude Code la
captura es automática con las herramientas `Task*`; el watcher del daemon las
espeja al tablero en ~1 s — **no dupliques con `jam work`**).

### 4. `race-hunter` — ataca la concurrencia

**Sin skill predefinido.** Es la Etapa 3 encarnada.
**Nunca implementa.** Solo escribe pruebas que rompen.

Su lista de ataque fija:
- **Doble reserva / doble gasto**: N peticiones simultáneas sobre el mismo
  recurso; exactamente una debe ganar
- **Replay de idempotencia**: la misma clave dos veces devuelve la respuesta
  original, sin repetir el trabajo
- **Check-and-act no atómico**: la ventana entre comprobar y actuar
- **Entrada malformada**: debe dar el error documentado, **nunca un 500**
- **Redondeo** (pista de pagos) / **zonas horarias** (pista de reservas)
- **Reintentos** durante fallo parcial

Del skill `architect`, §5, los invariantes que vigila:
*chokepoint enforcement*, *idempotency boundaries*, *durable-commit before
destructive step*, *concurrency discipline*.

### 5. `regression-guard` — nada se rompe

**Sin skill predefinido.** Es la Etapa 4 encarnada.

Mantiene la **suite dorada**: el conjunto de pruebas que pasaban en las etapas
1–3. Antes de que cualquier trabajo se declare terminado, ejecuta el gate
completo del proyecto —build, tests, lint, format-check, type-check y cualquier
drift check— y compara el recuento de pruebas contra la línea base comprometida.

Del skill `architect`, §4: *"Watch test-count drops. If total tests fall while
files were added, find out which were deleted and why."*

Trampa que vigila (§3 del skill): **nunca canalizar el gate por `tail` o `grep`**
— el exit code de un pipeline es el del último comando, así que un gate rojo
puede leerse como exit 0.

---

## El grafo de menciones

⚠️ **Regla del manual de Jam** (la más importante de todas):

> "Adding an agent to a room does not wake it. **A message must mention the agent**
> before Band sends it to that agent."
>
> "Every literal `@handle` in a room message wakes that participant. Write each
> handle as a **standalone token without adjacent punctuation**."

Y la regla de diseño que la acompaña:

> "When one participant must hand off later, **do not include the future
> recipient's literal handle in the current instruction**. Tell the current
> participant to inspect the room participants and mention the next participant
> itself."

**Consecuencia práctica:** no escribas la cadena de montaje en el brief inicial.
Escribe en cada rol la *regla* de a quién le toca después, y que cada agente
consulte `jam --session <scope> chat participants <chat-id>` y mencione él mismo
al siguiente. Eso es lo que convierte esto en una fábrica autónoma en vez de un
script con pasos cableados.

| Emisor | Cuándo | Busca en la sala a… |
|---|---|---|
| humano | al arrancar | el que planifica y revisa |
| `architect` | tras leer la spec | el que extrae conformidad |
| `spec-warden` | checklist lista | el que planifica y revisa |
| `architect` | tarea troceada | el que implementa |
| `builder` | implementación lista | el que verifica conformidad |
| `spec-warden` | conforme ✅ | el que ataca concurrencia |
| `spec-warden` | no conforme ❌ | el que implementa |
| `race-hunter` | sin hallazgos ✅ | el que guarda regresiones |
| `race-hunter` | hallazgos ❌ | el que implementa |
| `regression-guard` | gate verde ✅ | el que planifica y revisa |
| `regression-guard` | gate rojo ❌ | el que implementa |
| `architect` | decisión de producto | el humano |

---

## El "delete test"

La guía de hackers de BAND lo pide explícitamente: *¿qué se rompe si quitas BAND
del diseño?*

**Respuesta para esta banda:**

Sin BAND, los cinco agentes no tienen sala compartida, así que:

1. **Desaparece el rebote.** `spec-warden` y `race-hunter` no pueden devolver
   trabajo al `builder`: no hay canal entre pares. Con un orquestador clásico
   habría que cablear cada arista en código; aquí la aduana decide a quién
   menciona **en tiempo de ejecución**, según quién esté en la sala.
2. **Desaparece el reclutamiento en caliente.** El manual permite que un agente
   consulte los participantes y, *"when useful expertise is missing"*, busque en
   el registro de pares, añada un agente a la sala y delegue. Una fábrica que
   puede contratar no es una tubería.
3. **Desaparece la evidencia.** El tablero Work, el plan versionado, las trazas
   de herramientas espejadas y el coste por agente son el *"resultado verificado"*
   que pide el hackathon. Sin la sala hay código, pero no hay prueba de cómo se
   produjo.
4. **Desaparece el humano como par.** Las aprobaciones de permisos y las
   decisiones de producto llegan por la misma sala que el trabajo. No hay un
   canal aparte que mantener.

La coordinación **ocurre en BAND**. Quitarla no degrada la fábrica: la elimina.

---

## Una limitación que hay que declarar

El hackathon publica a los ganadores como casos de estudio incluyendo **"la
limitación"**. Declararla es parte del entregable, y ocultarla se nota.

**La nuestra:** un agente no puede aprobar la petición de permiso de otro. El
manual es explícito:

> "Only an eligible same-account decider can approve a permission request. **The
> requesting agent cannot approve its own request.**"
> "Jam never provides a bulk approval action; review queued requests one at a time."

Es decir: **la fábrica no es 100 % oscura.** Cada operación que dispare una
petición de permiso necesita a un humano (o al dueño de la sala respondiendo
`approve <id>` mencionando al que pregunta).

Mitigación: crear los agentes con los defaults de aprobación que ya minimizan las
peticiones —Claude Code en `Auto` con su clasificador activo, Codex en
`on-request` con Full access— de modo que *"routine file creation and deletion do
not need a human approval"*. Lo que quede son excepciones genuinas, y esas
**deben** tener un humano detrás. Vender lo contrario sería falso.
