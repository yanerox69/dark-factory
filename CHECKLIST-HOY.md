# Checklist de preparación — hacer hoy

Marca según avances. El orden importa: los pasos 1–3 afectan a cómo se crean los
agentes después.

---

## 1. Reiniciar Claude Code ⚠️ PRIMERO

La sesión actual arrancó antes de que Jam añadiera el CLI al PATH y antes de que
se instalaran los hooks del plugin. **Cierra Claude Code por completo y ábrelo de
nuevo.**

Verificación: en la sesión nueva, el comando `/jam` debe aparecer disponible.

- [ ] Claude Code reiniciado
- [ ] `/jam` aparece en la lista de comandos

---

## 2. Ajustes de Jam — Experiments

`Settings → Experiments`. Los tres están **apagados por defecto**.

- [ ] **Sessions** — vista de procesos, PID, binding y estado Band de todos los
      agentes a la vez. Sin esto solo ves un agente cada vez, desde su pestaña.
      Imprescindible para depurar 5 agentes.
- [ ] **Inbox** — cola completa de menciones y peticiones entre salas. Sin esto,
      Home solo muestra 5 filas y *no existe* lista de menciones entre salas.
- [ ] **Docker Sandboxes** — solo si vas a usar Docker (es patrocinador del
      hackathon). Actívalo **hoy**: la primera comprobación de runtime Docker
      puede tardar varios minutos descargando la imagen del proveedor.

---

## 3. Ajustes de Jam — Runtime

`Settings → Runtime`.

- [ ] **Room activity** → `full` (tools + resúmenes de razonamiento).
      Es lo que hace que la sala muestre la fábrica trabajando — material directo
      para el vídeo de entrega.
      ⚠️ Todo participante de la sala ve esos eventos. No metas secretos.
- [ ] **Human approval wait** → déjalo en el valor por defecto (espera
      indefinida) durante la preparación. Los otros valores (*Unattended* = 24 h,
      *Interactive* = 5 min) hacen **auto-deny**, no auto-allow: un timeout te
      deniega la operación y rompe la cadena.

---

## 4. Ajustes de Jam — General

`Settings → General`.

- [ ] **Run in background** → ON. Mantiene Jam vivo entre reinicios y cierres de
      sesión. Una fábrica que corre una semana lo necesita.
      (Al activarlo se reinicia brevemente el servicio local.)
- [ ] **Discovery / Sonar** — revisa `Discoverable`, `Share room names` y
      `Share cost`. Tienes Sonar activo. Apágalos en redes que no controles.
- [ ] **Version & CLI** — confirma que App, Daemon y CLI muestran la misma
      versión (deberían estar los tres en 0.4.10).

---

## 5. Crear los 5 agentes

`Agents → New local agent`, uno por uno. **Elige runtime Jam-owned (headless)**,
no sesión de terminal: un agente terminal muere al cerrar su ventana; uno
Jam-owned sobrevive a cerrar la ventana y se puede volver a arrancar.

⚠️ **Corregido el 24-09-2026.** Aquí ponía que un agente Jam-owned «se relanza
solo con el siguiente mensaje». **Es falso**, comprobado dos veces: si el
runtime está en `Stopped`, una mención en la sala no lo arranca, no crea nada y
no devuelve ningún error. Arrancarlo es manual, desde Jam Desktop. Detalles en
[FABRICA.md](FABRICA.md), sección «Cuando la banda está parada».

La descripción debe tener **mínimo 10 caracteres** o el formulario no deja crear.

Usa los nombres y las descripciones de abajo tal cual: todas superan el mínimo.
El mandato completo de cada asiento está en [roles/](roles/) y es lo que se pega
en las instrucciones del agente, no en el campo de descripción.

- [ ] `architect` — planifica, revisa, decide. Nunca implementa.
- [ ] `spec-warden` — conformidad literal con la especificación.
- [ ] `builder` — implementa API y UI.
- [ ] `race-hunter` — ataca concurrencia, idempotencia y entradas malformadas.
- [ ] `regression-guard` — nada de lo que ya funcionaba se rompe.

Para cada uno:
1. Nombre y descripción
2. Runtime: Jam-owned
3. Carpeta del proyecto (la misma para todos si comparten repo)
4. Revisa **Setup readiness** — corrige lo que marque
5. **Test runtime**
6. **Review** → **Create agent**

⚠️ Apunta el **handle completo** de cada agente según los vayas creando
(formato `@owner/nombre-xxxx`). Los necesitas para las menciones.

---

## 6. Crear UNA sala con los 5

`Rooms → New room`.

⚠️ **No uses Home → "Assign work"** para esto: cada asignación desde Home crea una
sala **nueva**. Tu fábrica vive en una sola sala.

- [ ] Sala creada
- [ ] Panel derecho → `Participants` → `Add participants` → añadir los 5 agentes
- [ ] Confirmar que tú (el humano) estás en la sala como dueño

---

## 7. Publicar plan y diagrama

Desde el agente `architect`, o manualmente por CLI. **El orden importa: primero
el diagrama, después el plan.**

```sh
jam --profile <perfil> --session <scope> plan diagram <chat-id> --file <ws>/architecture.json --label "Architecture" --snapshot
jam --profile <perfil> --session <scope> plan set     <chat-id> <ws>/plan.md --label "Plan" --snapshot
```

Las plantillas son [plan.md](plan.md) y [architecture.json](architecture.json), en
la raíz. Cópialas a la carpeta de trabajo de los agentes conservando esos nombres
exactos.

- [ ] `architecture.json` publicado con `--snapshot`
- [ ] `plan.md` publicado con `--snapshot`
- [ ] El diagrama se ve en el plan rail de la sala
- [ ] Al pulsar un nodo del diagrama, el tablero Work se filtra

---

## 8. Ensayo general

Ejecuta [ensayo-general.md](ensayo-general.md) completo.

Esto no prueba tu código: prueba **la fábrica**. Si algo falla, tienes hasta el
25 de septiembre para pedir ayuda en el Discord de BAND.

- [ ] Ensayo ejecutado
- [ ] Los 6 criterios de aceptación pasan

---

## 9. Andamiaje del entregable

- [ ] Repositorio GitHub **público** creado
- [ ] **Licencia MIT** en el repo (es requisito explícito del hackathon)
- [ ] Deploy en Vercel funcionando con un "hola mundo" — que la URL exista desde
      el día 1, no el último día
- [ ] Carpeta `evidencia/` en el repo para volcar trazas, capturas y costes

---

## 10. Inscripción y patrocinadores

- [ ] Inscripción en lablab.ai confirmada
- [ ] Discord conectado al perfil de lablab
- [ ] Discord de BAND: https://discord.com/invite/5YkNXmYfjk
- [ ] Preguntado en Discord qué pista está menos concurrida
- [ ] Entrada gratuita al WeAreDevelopers World Congress reclamada (si interesa;
      el congreso es 23–25 sep, **antes** del build)
- [ ] Pendiente: email de **Featherless** con el código promocional ($25 en
      créditos), llega poco antes del inicio
      ⚠️ Featherless **pide tarjeta** al registrarse. Pon un recordatorio para
      cancelar antes del siguiente ciclo de facturación si no lo vas a seguir usando.

---

## Estado final esperado

Al terminar hoy deberías poder decir:

> "Tengo 5 agentes Jam-owned en una sala, con plan y diagrama publicados. Le doy
> una tarea al architect, se reparte el trabajo entre los cinco por menciones,
> el verificador rechaza lo que no cumple, y todo sobrevive a que cierre y
> reabra la aplicación."

Si puedes decir eso, el día 26 solo tienes que leer la especificación y arrancar.
