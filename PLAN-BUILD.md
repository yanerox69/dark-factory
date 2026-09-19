# Plan del build

**Objetivo: entrega válida el primer día, y mejorarla hasta el 4.**

No se puede entregar antes del 26 —la especificación no existe hasta entonces—
pero sí se puede tener una entrega válida en el bote en cuestión de horas y
convertir *"¿llegaré?"* en *"¿cuánto puedo mejorarlo?"*.

Lo mínimo para ser elegible es **una `stage-1/` completa**. Y basta **una
inscripción válida** en la pista para que se otorgue el primer puesto.

| | Hora de Venezuela |
|---|---|
| Arranque | sábado 26 sep, **12:00** |
| Cierre | domingo 5 oct, **02:59** |
| Último día completo | **sábado 4** |

---

## ⚠️ La trampa de las carpetas por etapa

Esto decide si puntúas o no, y es contraintuitivo:

> *"Each folder is graded against every test suite up to its own number:
> `stage-3/` must pass suites 1, 2 and 3. **Each folder must hold that stage's
> solution — one that also passes the next stage's suite is a later answer in the
> wrong folder and earns nothing for its own stage.**"*

Traducción: `stage-1/` tiene que pasar la suite 1 **y no pasar la 2**. Cada
carpeta es **la foto del trabajo en esa etapa**, no el resultado final copiado
hacia atrás.

**Método obligatorio: congelar antes de avanzar.**

```
construir etapa 1  →  copiar a stage-1/  →  CONGELAR, no tocar nunca más
seguir desde una copia de trabajo  →  etapa 2  →  copiar a stage-2/  →  CONGELAR
...
```

Si construyes las cuatro etapas y luego repartes en carpetas, **pierdes los
puntos de las tres primeras**. Es el error más caro posible y es silencioso.

---

## El techo real: peticiones, no horas

Los modelos gratuitos de OpenRouter son ilimitados en tokens pero se racionan por
petición, y **cada ciclo de uso de herramienta es una petición**.

| Plan | Peticiones/día | Qué permite |
|---|---|---|
| Actual, sin comprar créditos | **50** | dos o tres turnos de agente; imposible hacer una etapa al día |
| **+$10 únicos, de por vida** | **1.000** | el plan de abajo |
| Featherless | según créditos | complemento; el código llega por email antes del arranque |

**Sin resolver esto, el plan de abajo no es ejecutable.** No es cuestión de
esfuerzo: con 50 peticiones no llegas.

### Reparto orientativo con 1.000/día

| Fase | Peticiones | Por qué |
|---|---|---|
| Spec → checklist de conformidad | ~150 | Lectura densa, una vez. Es lo más caro y lo que más valor da |
| Implementación de una etapa | ~350 | El grueso |
| Verificación de conformidad | ~200 | Va contra el código que corre, no contra el informe |
| Ronda adversarial | ~200 | Escribir reproductores cuesta |
| Gate y veredicto | ~100 | Barato |

Una etapa completa ronda las **1.000 peticiones**, o sea **un día**. De ahí el
calendario.

**Ahorros que funcionan:** no repitas la lectura de la spec en cada seat —el
`spec-warden` la destila una vez y los demás trabajan contra la checklist. Y no
dejes seats despiertos sin tarea: cada turno vacío cuesta.

---

## Día 0 — antes del 26

- [ ] **Resolver el caudal.** Los $10 de OpenRouter, o los créditos de
      Featherless en cuanto llegue el correo, o ambos
- [ ] **Arrancar Docker Desktop** y pasar la prueba de contenedor limpio sobre
      `dry-run/` (ver abajo)
- [ ] **Probar la grabación de pantalla** de la sala de BAND. Sin ese material el
      vídeo descalifica, así que no puede fallar el día 1
- [ ] **Restaurar la banda de cinco** si hay caudal:
      `jam chat add --as yanerox69/architect $room yanerox69/race-hunter yanerox69/regression-guard`
- [ ] Repasar que las mandates siguen genéricas: `harness check` las escanea

## Día 1 — sábado 26, desde las 12:00

**Empieza grabando.** La grabación de la sala es requisito de no descalificación;
si se te olvida encenderla, el trabajo no cuenta.

1. **12:00** — Cae la spec. El `architect` la lee y publica el plan de sala
2. **12:30** — El `spec-warden` produce la checklist de conformidad numerada.
   Esta es la inversión que rentabiliza todo lo demás: si la checklist es buena,
   el resto es mecánico
3. **13:00** — Q&A en Discord. Lee aunque no preguntes; ahí salen las
   ambigüedades que otros detectan
4. **Tarde** — El `builder` implementa la etapa 1 contra la checklist. Aduanas
   verifican. Rebotes hasta CONFORMS
5. **Noche** — **Congelar en `stage-1/`.** `harness check`. Push
6. **ENTREGAR.** Aunque esté áspera. Ya eres elegible

⚠️ **Comprueba al entregar si el formulario deja editar después.** Si sí, sigues
mejorando sobre la entrega. Si no, esta es tu única bala y hay que replanificar.

## Días 2 a 4 — una etapa por día

| Día | Etapa | Nota |
|---|---|---|
| Domingo 27 | **2 — UI web** | Los `data-testid` exactos. Es copiar nombres, no diseñar |
| Lunes 28 | **3 — concurrencia** | La difícil. Aquí el `race-hunter` gana su sitio |
| Martes 29 | **4 — extensión** | Sin romper nada de lo que ya pasa |

Cada día: congelar la carpeta, `harness check`, push, **actualizar la entrega**.

## Día 5 — miércoles 30

- [ ] `harness export-room` — el export de la sala va en el repo
- [ ] Prueba de contenedor limpio **sin red saliente** sobre cada `stage-N/`
- [ ] Ejecutar cada suite contra su carpeta y **comprobar que `stage-N/` no pasa
      la suite N+1**

## Días 6 y 7 — jueves 1 y viernes 2

- [ ] Montar el vídeo con [GUION-VIDEO.md](GUION-VIDEO.md). 2:55, con la sala
      grabada
- [ ] Rellenar los `[corchetes]`: ítems de conformidad, tests, rebotes
- [ ] Regenerar `deck.pdf` y la portada con los números reales
- [ ] Entrega final completa

## Sábado 3 y 4 — colchón

Dos días enteros de margen. **No los planifiques.** Son para lo que salga mal, y
esta semana ha demostrado que algo sale mal.

---

## Prueba de contenedor limpio

Requisito: *"It must build and serve from a clean container with no outbound
network. A service that doesn't start scores zero."*

Ensáyalo ahora sobre `dry-run/`, que ya existe:

```powershell
cd dry-run
docker build -t darkfactory-dryrun .
docker run --rm --network none -p 3000:3000 darkfactory-dryrun
```

`--network none` es la parte que importa: sin red saliente. Si el servicio
necesita descargar algo al arrancar, ahí revienta.

### 🚨 La trampa del bind

El servicio del ensayo hace `server.listen(port, '127.0.0.1')`. Dentro de un
contenedor, **`127.0.0.1` es solo alcanzable desde dentro del propio
contenedor**. Un `-p 3000:3000` no llega a nada y el corrector ve un servicio
muerto.

**En cada `stage-N/`, el servidor tiene que escuchar en `0.0.0.0`** (o en todas
las interfaces) para ser alcanzable desde fuera del contenedor.

⚠️ Y ojo con el conflicto: si la spec del reto pide explícitamente `127.0.0.1`
—como pedía la del ensayo—, hay que satisfacer las dos cosas. La salida limpia es
leer el host de una variable de entorno con `127.0.0.1` por defecto:

```js
const host = process.env.HOST || '127.0.0.1';
server.listen(port, host);
```

Así las pruebas locales cumplen la spec y el contenedor arranca con
`HOST=0.0.0.0`. **Pon esto en el brief del `architect` el día 1**: descubrirlo el
día de la entrega es de los errores que puntúan cero.

### Comprobar el ensayo desde dentro

Como el ensayo sí escucha en `127.0.0.1`, se verifica desde dentro del propio
contenedor:

```powershell
docker run --rm --network none darkfactory-dryrun sh -c "node src/server.js & sleep 1; node -e \"require('http').get('http://127.0.0.1:3000/seats',r=>{console.log('HTTP',r.statusCode);process.exit(r.statusCode===200?0:1)})\""
```

Si imprime `HTTP 200`, el patrón de contenedor funciona: construye, arranca y
sirve sin red. Lo que cambia en las etapas reales es el bind.
