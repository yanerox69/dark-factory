# Ensayo general

**Esto no prueba tu código. Prueba la fábrica.**

Windows es soporte de segunda en Jam (la documentación online llega a decir
*"Windows is not supported yet"* mientras ofrece el instalador `.exe`). Todo tu
hackathon vive dentro de Jam. Hay que saber hoy si el flujo completo aguanta,
no el 26 con el cronómetro corriendo.

Si algo falla, queda margen hasta el 25 de septiembre para pedir ayuda en el
Discord de BAND: https://discord.com/invite/5YkNXmYfjk

---

## Preparación

```powershell
$jam  = "$env:LOCALAPPDATA\Programs\jam\bin\jam.exe"
$room = "01658ca5-794f-4b70-859a-49c7441442b1"
```

---

## El brief de prueba

Es deliberadamente un dominio pequeño que ejercita **exactamente** los músculos
de las cuatro etapas del hackathon, sin depender de la especificación real (que
no se publica hasta el 26) ni de qué pista elijas.

```powershell
& $jam room send $room @'
@yanerox69/architect Dry run before the hackathon. Build a small seat reservation HTTP service in this workspace, under dry-run/.

Requirements:
- POST /reserve taking seat_id and idempotency_key, returning documented JSON error codes.
- GET /seats listing seats with their state.
- A seat can never be double-booked under concurrent requests.
- A repeated request with the same idempotency_key returns the original response without doing the work twice.
- Malformed input returns the documented error, never a 500.

Write the spec first as dry-run/SPEC.md, then have it turned into a conformance checklist, then implement against that checklist, then attack it, then gate it.

Inspect the room participants and route the work yourself. Ask me only when you need a product decision.
'@
```

---

## Los 6 criterios de aceptación

Marca cada uno. Todos tienen que pasar.

### 1. La mención despierta al agente

- [ ] El `architect` responde en la sala sin que hagas nada más

Si no responde: `& $jam inbox --as yanerox69/architect` para ver si el mensaje
llegó a la cola. Si está en cola pero no se procesa, el runtime no arrancó.

### 2. El enrutamiento autónomo funciona

- [ ] El `architect` menciona al `spec-warden` **por su cuenta**, sin que tú
      hayas puesto ese handle en el brief

Este es el criterio que separa una fábrica de un script. Si el architect no
encadena solo, revisa que las instrucciones de rol se aplicaron (se aplican en el
siguiente spawn/wake, no al instante).

### 3. La cadena completa recorre los cinco

- [ ] `architect` → `spec-warden` → `builder` → `spec-warden` → `race-hunter` →
      `regression-guard` → `architect`
- [ ] Al menos **un rechazo** vuelve hacia atrás al `builder`

Un ensayo donde todo pasa a la primera no ha probado el rebote, que es la parte
frágil. Si no rechaza nada espontáneamente, introduce tú un fallo: cambia un
nombre de campo en el código y comprueba que `spec-warden` lo caza.

### 4. Cinco agentes en paralelo no tumban el daemon

- [ ] `& $jam list` sigue mostrando los cinco `Connected`
- [ ] `& $jam preflight` sigue en verde
- [ ] `Settings → Logs → Daemon (jamd)` no muestra errores repetidos

### 5. El tablero y las swim lanes muestran algo grabable

- [ ] `& $jam work board $room` muestra tareas compartidas
- [ ] En la app, `Work → By agent` muestra carriles por agente con movimiento
- [ ] Al pulsar un nodo del diagrama, el tablero se filtra

Esto es tu material de vídeo. Si las swim lanes salen vacías, los agentes no
están manteniendo sus tareas privadas al día — recuérdaselo en el rol.

### 6. Sobrevive a un reinicio

- [ ] Cierra Jam Desktop por completo y ábrelo
- [ ] `& $jam list` muestra los cinco otra vez
- [ ] La sala conserva historial, plan y tablero
- [ ] Un mensaje nuevo despierta a los agentes sin crear identidades nuevas

⚠️ Si un agente no vuelve, usa `attach` / `reattach`, **nunca** crees una
identidad nueva. Duplicar identidades es el error clásico y Band limita las
membresías por agente.

---

## Extra: mide el coste

El hackathon publica a los ganadores como casos de estudio con *"la tarea, la
banda, la decisión clave de diseño, el resultado verificado, **el coste** y la
limitación"*.

```powershell
& $jam usage
& $jam stats
```

- [ ] Anota el coste del ensayo completo

Te da el orden de magnitud de lo que costará una semana de hackathon, y es un
dato que vas a necesitar entregar. Ojo: los datos de coste son **locales**, no se
suben a Band, así que expórtalos antes de entregar.

---

## Si algo falla

| Síntoma | Dónde mirar |
|---|---|
| El agente no responde | `jam inbox --as <handle>`; ¿el mensaje lo menciona? |
| No arranca el runtime | `jam sessions --as <handle>`; `Settings → Logs` |
| La sala no recibe respuestas | `jam sessions`; ¿el binding nombra la sala? |
| Todo lento o colgado | `jam restart --as <handle>` |
| Estado incoherente | `jam doctor`; `jam reconcile` |

**Documenta lo que falle.** Si es un bug de Windows, reportarlo en el Discord de
BAND antes del 26 juega a tu favor: los organizadores ven que estás construyendo
en serio, y puede que te arreglen el bloqueo.
