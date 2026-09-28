# Guion del vídeo

**Objetivo: 2:55.** El límite son 5 minutos, pero un jurado ve decenas de
entregas y la referencia que funciona dura menos de 3.

Reescrito el 28-09-2026. La versión anterior era para la banda de cinco agentes
(`architect`, `spec-warden`, `builder`…) y terminaba en una demo sobre Vercel.
Nada de eso existe: son **tres asientos** y el producto es una **API sin
interfaz**.

---

## 🚨 El metraje que tienes NO sirve

> *"Your video must include a recording of the BAND Desktop room that generated
> your solution. **A video without the room recording disqualifies your team.**"*

En `C:\Users\Yanero\Videos\Captures` hay ocho ficheros, todos del **24 y 25 de
septiembre**. El run juzgado es del **27, de 20:05 a 23:55**. Ese metraje es de
la sala de ensayo con la banda vieja: no es la sala que generó la entrega, y
usarlo como si lo fuera es exactamente lo que la regla castiga.

**Hay que grabar de nuevo.** La buena noticia: la regla pide *una grabación de
la sala*, no una grabación *en directo mientras genera*. La sala del 27 sigue
abierta en Band Desktop con sus 451 mensajes. Recorrerla en pantalla —los
mensajes reales, el tablero, el historial de tareas— cumple el requisito y
además se lee mejor, porque puedes ir directo a los momentos que importan en vez
de esperar a que ocurran.

---

## El plano que gana

**El rechazo del `reviewer` al `coordinator`.** No hace falta provocar nada: ya
está en la sala, y es mejor que un rebote de código.

A las **20:12:31** el `coordinator` publica cuatro ambigüedades de la spec con su
lectura recomendada. La A3 dice: trata el cuerpo vacío como un objeto vacío.

A las **20:29:11** el `reviewer` responde en su checklist:

> **A3 — CONFIRM, with caveat.** The canonical stored body for idem comparison
> MUST be `{}` so an empty-body replay matches; `{"visibility":"public"}` is a
> different JSON value and reusing the key across the two → 409
> `idempotency_key_reuse`.

Un asiento corrigiendo a otro sobre *qué debe almacenar* el endpoint, no *qué
debe aceptar* — y el error que evita es un fallo de dinero bajo reintentos.
Todos los demás equipos enseñarán agentes **produciendo**. Tú vas a enseñar uno
**rechazando**, y a un compañero, no a un humano.

Dale aire. Que se lea entero.

---

## Capturas necesarias

Todas de la sala del 27 en Band Desktop. Graba de sobra y recorta después.

⚠️ **Las horas de abajo son las que muestra Jam**, o sea locales. El `room.json`
guarda UTC, cuatro horas por delante: lo que el log llama `23:50:29` es
`7:50 p.m.` en pantalla. Si buscas por la hora del log no encuentras nada.

La sala, en hora de pantalla, va de **4:05 p.m. a 7:55 p.m.** del 27.

| # | Qué | Dónde | Hora en Jam | Mín. |
|---|---|---|---|---|
| A | La sala con los tres asientos en la lista de participantes | Jam → Chat | — | 10 s |
| B | El mensaje de arranque y el `coordinator` despertando | Jam → Chat | **4:06 p.m.** | 12 s |
| C | La checklist de 158 ítems, haciendo scroll por ella | Jam → Chat | **4:29 p.m.** | 20 s |
| D | **El rechazo**: A3 del coordinator → "CONFIRM, with caveat" del reviewer | Jam → Chat | **4:12 → 4:29 p.m.** | 25 s |
| E | Un `@mention` de asiento a asiento, con respuesta en el otro sentido | Jam → Chat | **4:33 → 4:34 p.m.** | 15 s |
| F | El tablero con las 17 tareas y sus estados | Jam → Work | — | 15 s |
| G | La suite: `147/147`, `claimed stage: 1` | Terminal | — | 15 s |
| H | `money.go` — `applyDelta` y `settleBatch` | Editor | — | 10 s |

Para orientarte en el scroll: el mensaje de las **7:50 p.m.** es el tuyo diciendo
`662893a passes the shipped checks 147/147`. Es el final de la sala. Desde ahí,
sube.

⚠️ **Antes de grabar cualquier terminal o editor, comprueba que no hay claves a
la vista.** `agent_config.yaml` tiene las `api_key` de los tres asientos y una
clave de agente se acuña una sola vez. No abras esa carpeta en pantalla.

⚠️ En la sala se ven tus seis mensajes. No pasa nada: la entrega ya los declara
en `FACTORY.md` y en la descripción larga. No intentes esconderlos.

---

## Escaleta

### 0:00 – 0:12 · Gancho

**Rótulo a pantalla completa**, sin nada más:

> **What if two thirds of your factory weren't allowed to write code?**

Corte seco. Sin logo, sin "hola somos el equipo".

---

### 0:12 – 0:30 · La afirmación y el patrocinador

**Rótulo arriba, captura A debajo** (la sala con los tres asientos)

> **THIS IS DARK FACTORY, BUILT IN BAND.**
> **THREE CODING AGENTS IN ONE ROOM. TWO OF THEM CANNOT WRITE CODE.**

BAND tiene que aparecer aquí, en el segundo 20, no al final.

---

### 0:30 – 2:00 · LA DEMO — 90 segundos

**El corazón del vídeo.** Sin rótulos salvo los marcadores de esquina.

| Tiempo | Captura | Rótulo en esquina |
|---|---|---|
| 0:30 | B — el arranque, un solo mensaje | `ONE HUMAN MESSAGE` |
| 0:42 | C — la checklist de 158 ítems | `THE CONTRACT, BEFORE ANY CODE` |
| 1:02 | **D — el rechazo** | `ONE SEAT CORRECTS ANOTHER` |
| 1:27 | E — el `@mention` y la respuesta | `NOBODY WIRED THIS HANDOFF` |
| 1:42 | F — el tablero moviéndose | `SEVENTEEN TASKS, CLAIMED BY THE SEATS` |

**El tramo 1:02–1:27 es el que gana.** Que se lea el *with caveat* y lo que
viene detrás.

Si el ritmo decae, acelera 2× los tramos de scroll — **nunca el rechazo**.

---

### 2:00 – 2:22 · Las pruebas

**Tres rótulos encadenados**, ~7 s cada uno, sobre las capturas G y H:

> **147 TESTS. 147 PASSING.**
> *run by us, not reported to us*

> **NO `float64` ON THE MONEY PATH — 23 FILES, ZERO MATCHES**
> *the reviewer wrote that rule before the code existed*

> **3 h 49 m · 11,743,469 TOKENS · $11.70**
> *measured in the room log, not a dashboard*

---

### 2:22 – 2:36 · La honestidad

**Rótulo a pantalla completa, fondo oscuro:**

> **WE STOPPED THE REVIEWER TO SAVE BUDGET.**
> **IT MISSED TWO DEFECTS. WE FOUND THEM AT THE GATE.**

Catorce segundos que ningún otro equipo va a gastar. Los jueces tienen el
`room.json`: contarlo tú primero se lee como rigor, y que lo encuentren ellos se
lee como maquillaje. Además prepara el cierre.

---

### 2:36 – 2:48 · El delete test

**Rótulo a pantalla completa:**

> **TAKE BAND OUT AND THE FACTORY DOESN'T DEGRADE.**
> **IT DISAPPEARS.**
> *the rejection has no channel*

---

### 2:48 – 2:55 · Cierre

> Logo de **BAND**
> `github.com/yanerox69/dark-factory-pocketful`
> **Track: pocketful · @yanerox69**

Sin URL de demo: esta pista no la pide y la API no tiene interfaz.

---

## Los números, ya definitivos

No quedan corchetes. Todo esto sale de `room.json` y del historial de git:

| | |
|---|---|
| Duración | 3 h 49 m (20:05:39 → 23:55:03 **UTC**, sin reinicios — en Jam, 4:05 → 7:55 p.m.) |
| Mensajes | 451, con 206 llamadas a herramienta |
| Tokens | 11.743.469 — 11.530.554 entrada / 212.915 salida |
| Ratio | entrada : salida = **54 : 1** |
| Coste | 11,70 $ de un crédito de 25 $ |
| Resultado | 147/147, `claimed stage: 1`, modo aislado, contra `b4af9b5` |
| Reparto | implementer 310 mensajes · coordinator 107 · reviewer 28 · humano 6 |

---

## Montaje

`ffmpeg` 9.0 está instalado, y Clipchamp viene con Windows 11 si prefieres
línea de tiempo visual.

**Cortar un tramo** (rápido y sin recodificar la fuente entera):

```bash
ffmpeg -ss 00:12:40 -to 00:13:05 -i "entrada.mp4" -c:v libx264 -crf 20 -preset slow -c:a aac corte-D.mp4
```

**Acelerar 2× un tramo de scroll** (sin audio):

```bash
ffmpeg -i corte-C.mp4 -filter:v "setpts=0.5*PTS" -an corte-C-rapido.mp4
```

**Comprimir el montaje final** — a 1080p con CRF 23 salen unos 110 MB por 3
minutos, muy por debajo del tope de 300 MB:

```bash
ffmpeg -i montaje.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart final.mp4
```

**Comprobar antes de subir** que cumple duración y tamaño:

```bash
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 final.mp4
```

`duration` por debajo de 300 y `size` por debajo de 314572800.

---

## Lo que NO hay que hacer

**No uses el metraje del 24–25.** Es la sala de ensayo con otra banda. Es el
único error de esta lista que descalifica.

**No expliques qué es un agente ni qué es un LLM.** El jurado lo sabe. Cada
segundo de contexto genérico es un segundo robado a la demo.

**No enseñes el deck entero.** Los rótulos salen del deck; el deck se entrega
aparte en PDF. Narrar 15 diapositivas es lo que hace que un vídeo dure cinco
minutos y no lo vea nadie entero.

**No pongas música épica sobre una demo de código.** Silencio o algo neutro.

**No grabes cara parlante.** Voz sí, cara no: más rápido de producir y la
referencia no la tiene.

---

## Notas de producción

**Voz en off, con los rótulos acompañándola.** El texto en pantalla no sustituye
a la narración, la refuerza. Y los rótulos tienen que sostenerse solos de todos
modos, porque muchos jueces ven la primera pasada en silencio.

**Subtítulos siempre.**

**Tono:** afirmativo. "La banda construyó", no "la banda podría construir". Todo
lo que se cuenta ocurrió y está en la sala.

**El plano de audio que iguala a la referencia:** lee en voz alta el *with
caveat* del reviewer mientras aparece en pantalla. Que se oiga el sistema
corrigiéndose a sí mismo.

**Formato:** MP4, menos de 5 minutos, máximo 300 MB.
