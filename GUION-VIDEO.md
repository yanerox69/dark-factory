# Guion del vídeo

**Objetivo: 2:55.** El límite son 5 minutos, pero la referencia que funciona dura
menos de 3 y eso no es casualidad — un jurado ve decenas de entregas.

## La forma

Estructura tomada de una entrega de lablab que funcionó (*Siberia Voice Agent*,
AssemblyAI): **gancho en tipografía cinética → afirmación con el patrocinador →
demo en vivo larga → pruebas → cierre con logo**.

La clave, y es lo contrario de lo que suele hacerse: **la mitad del metraje es el
sistema funcionando**, no diapositivas hablando del sistema. El deck aporta los
rótulos; el protagonista es la sala.

**Voz en off, con los rótulos acompañándola.** El análisis del audio de la
referencia muestra habla repartida por todo el metraje —ráfagas separadas por
pausas de 1,5 a 6,6 segundos, que es patrón de voz y no de música—, así que el
texto en pantalla no sustituye a la narración: la refuerza.

Sin cara parlante: en la referencia no aparece nadie, solo rótulos y demo.

Los rótulos tienen que sostenerse solos de todos modos, porque muchos jueces ven
la primera pasada en silencio.

---

## 🚨 Requisito que descalifica

> *"Your video must include a recording of the BAND Desktop room that generated
> your solution, and a walkthrough. **A video without the room recording
> disqualifies your team.**"*

No es opcional ni decorativo: **la sala de BAND Desktop tiene que verse grabada**.
El tramo de demo de esta escaleta ya lo cubre —capturas A, B, D y E son todas de
la sala—, pero grábalas primero y con margen. Si algo se queda sin grabar, que no
sea eso.

## Antes de grabar

### El plano que gana

**El rebote.** Un verificador devolviendo trabajo al `builder` con
expected-vs-actual, en vivo, en la sala. Ningún otro equipo va a enseñar eso:
todos enseñarán agentes produciendo, no agentes **rechazando**.

Si en la corrida real no rebota nada espontáneamente, provócalo: cambia un nombre
de campo en la implementación y deja que el `spec-warden` lo cace. Es legítimo —
estás mostrando el mecanismo, no falseando un resultado.

### Capturas necesarias

Todas **mientras la fábrica trabaja**. Graba de sobra y recorta después.

| # | Qué | Dónde | Mín. |
|---|---|---|---|
| A | El brief publicado y el architect despertando | Jam → Chat | 15 s |
| B | Un `@mention` de agente a agente, legible | Jam → Chat | 10 s |
| C | Las swim lanes moviéndose, tareas cambiando de estado | Jam → Work → By agent | 25 s |
| D | **El rebote**: rechazo volviendo al builder | Jam → Chat | 20 s |
| E | El veredicto final del architect | Jam → Chat | 10 s |
| F | La suite pasando, con el recuento final | Terminal | 15 s |
| G | La app de pocketful haciendo una transferencia | Navegador, sobre Vercel | 20 s |

⚠️ Antes de grabar cualquier terminal, comprueba que no hay claves a la vista.

### Rótulos

Negro sobre blanco, tipografía gruesa, una frase por pantalla, entrada palabra a
palabra. Las diapositivas del deck sirven de base: `cover`, `crew`, `proof`,
`emergent`, `deletetest` y `closing`.

---

## Escaleta

### 0:00 – 0:16 · Gancho
**Rótulo a pantalla completa**, sin nada más:

> **What if the factory refused its own work?**

Corte seco. Sin logo, sin introducción, sin "hola somos el equipo".

---

### 0:16 – 0:36 · La afirmación y el patrocinador
**Rótulo arriba, captura A debajo** (la sala con los agentes)

> **THIS IS DARK FACTORY, BUILT IN BAND.**
> **FIVE CODING AGENTS IN ONE ROOM — FOUR OF THEM FORBIDDEN FROM WRITING CODE.**

Aquí es donde BAND tiene que aparecer, igual que la referencia pone AssemblyAI en
el segundo 20. No lo dejes para el final.

---

### 0:36 – 2:05 · LA DEMO — 90 segundos
**El corazón del vídeo.** Sin rótulos salvo los cuatro marcadores en esquina.

| Tiempo | Captura | Rótulo en esquina |
|---|---|---|
| 0:36 | A — el brief, el architect despierta | `THE BRIEF` |
| 0:50 | B — el architect menciona al spec-warden | `NOBODY WIRED THIS HANDOFF` |
| 1:05 | C — swim lanes moviéndose | `THREE AGENTS, IN PARALLEL` |
| 1:25 | **D — el rebote** | `ONE DEVIATION REJECTS` |
| 1:50 | E + F — veredicto y suite en verde | `GATE GREEN` |

**El tramo 1:25–1:50 es el que gana el hackathon.** Dale aire. Que se lea el
mensaje de rechazo: expected vs actual, y el trabajo volviendo atrás.

Si el ritmo decae, acelera 2× los tramos de espera — pero **nunca el rebote**.

---

### 2:05 – 2:30 · Las pruebas
**Tres rótulos encadenados**, cada uno unos 8 segundos, sobre capturas de fondo:

> **87 TESTS. 87 PASSING.**
> *run by us, not reported to us*

> **AN AGENT WITHDREW ITS OWN FALSE FINDING**

> **AN AGENT CORRECTED ITS SUPERVISOR: "87, NOT 83." IT WAS RIGHT.**

Ninguna de las tres estaba en el brief. Eso es lo que las hace valer.

---

### 2:30 – 2:44 · El delete test
**Rótulo a pantalla completa:**

> **TAKE BAND OUT AND THE FACTORY DOESN'T DEGRADE.**
> **IT DISAPPEARS.**

Es la pregunta que la guía de hackers de BAND hace a toda entrega. Contéstala en
una frase y en pantalla, no de pasada.

---

### 2:44 – 2:55 · Cierre
**Captura G** (la app funcionando) durante 5 s, luego tarjeta final:

> Logo de **BAND**
> `github.com/yanerox69/dark-factory`
> `dark-factory-sepia.vercel.app`

---

## Lo que NO hay que hacer

**No expliques qué es un agente ni qué es un LLM.** El jurado lo sabe. Cada
segundo de contexto genérico es un segundo robado a la demo.

**No enseñes el deck entero.** Los rótulos salen del deck; el deck se entrega
aparte en PDF. Narrar 12 diapositivas es lo que hace que un vídeo dure cinco
minutos y no lo vea nadie entero.

**No pongas música épica sobre una demo de código.** Silencio o algo neutro.

**No grabes cara parlante.** La referencia no la tiene y es más rápido de
producir. Voz sí, cara no.

## Notas de producción

**Subtítulos siempre.** Llevas voz en off, así que hacen falta para quien vea en
silencio.

**Tono de la narración:** afirmativo. "La banda construyó", no "la banda podría
construir". Todo lo que se cuenta ocurrió y está en la sala.

**Un plano que la referencia tiene y tú puedes igualar:** en su demo se *oye* al
agente responder. Tu equivalente es leer en voz alta el mensaje de rechazo
mientras aparece en pantalla — que se oiga el sistema negándose.

**Formato:** MP4, menos de 5 minutos, máximo 300 MB. A 1080p con
compresión normal, 3 minutos caben de sobra.

**Los números:** sustituye los del ensayo por los del build real antes de grabar,
aquí y en las diapositivas `proof` y `product`.
