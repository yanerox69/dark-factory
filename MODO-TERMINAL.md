# Modo terminal — fábrica sin coste de API

Configuración alternativa para trabajar **sin saldo de clave API**, usando el
acceso de Claude Code que ya tienes.

## Por qué

Los agentes Jam-owned (headless) lanzan `claude` en segundo plano y necesitan
`ANTHROPIC_API_KEY` con saldo. Los agentes **acoplados a terminal** usan la
sesión interactiva que tú abres, con la autenticación que esa sesión ya tenga.

## El precio que pagas

| | Jam-owned (headless) | Terminal acoplado |
|---|---|---|
| Coste | saldo de API | el de tu sesión |
| Ventanas abiertas | ninguna | **una por agente** |
| Si cierras la ventana | se relanza solo | **el agente muere** |
| Si se cae el runtime | Jam arranca otro | nada local puede alcanzarlo |
| Arranque | bajo demanda | manual |

El manual es explícito:

> *"A terminal agent is the opposite — when its window is gone, nothing local can
> reach or restart it, so the card greys and the picker holds it back until a
> session returns."*

Para una "fábrica oscura" es menos elegante: necesitas las ventanas vivas. Pero
funciona y no cuesta nada.

## La banda reducida

Tres roles, tres ventanas:

| Rol | Absorbe |
|---|---|
| `architect` | + el gate de regresión y la suite dorada |
| `spec-warden` | + el ataque de concurrencia |
| `builder` | — |

`race-hunter` y `regression-guard` siguen existiendo como identidades en tu
cuenta BAND, fuera de la sala. Cuando lleguen los créditos de Featherless se
vuelven a añadir con `jam chat add` y recuperas la banda de cinco.

---

## Estado: validado el 22 de septiembre de 2026

El enganche funciona. Una ventana de Claude Code se unió a Jam como peer usando
la autenticación de la propia sesión, **sin clave de API ni saldo**:

```
handle          yanerox69/terminal-probe-zh7w
estado          parked · receiver.active = true
coste           $0
```

Se usó un rol de prueba aparte, `terminal-probe`, en vez de uno de los cinco
asientos, para no arriesgar una identidad duplicada (ver el aviso del paso 3).
La identidad de prueba se borra con:

```powershell
& $jam rm --as yanerox69/terminal-probe-zh7w
```

⚠️ **Lo que esto no prueba.** Valida la fontanería —identidad, lease, receptor—,
no la calidad del bucle agéntico. Que el agente encadene pasos y use herramientas
bien sigue pendiente de la prueba del `PING.md` de
[OPENROUTER.md](OPENROUTER.md), que necesita sala y compañero.

⚠️ Antes de empezar, lee las dos trampas del PATH en
[FABRICA.md](FABRICA.md): con Jam Desktop cerrado no arranca nada, y «arreglar»
el PATH a mano rompe el CLI de una forma que el error no explica.

## Procedimiento

### Paso 1 — comprobar la integración

`Settings → Integrations` en Jam Desktop. **Claude Code** debe estar encendido.
Si acabas de cambiar algo, ejecuta `/reload-plugins` en las sesiones abiertas o
reinicia Claude Code.

### Paso 2 — una ventana por rol

Abre **tres** ventanas de Claude Code, todas en
`C:\Users\Yanero\Desktop\dark-factory`.

En cada una, lo primero es cargar el rol:

```
Lee roles/architect.md y actúa según ese rol a partir de ahora.
```

(y lo mismo con `roles/spec-warden.md` y `roles/builder.md` en las otras dos).

### Paso 3 — unir cada sesión a la sala

En Jam Desktop, abre la sala y ve a **Participants → Add participants →
Coding sessions → Claude**. Copia la instrucción de sala y **pégala en la ventana
de Claude Code** correspondiente.

La sesión aparece como agente en la sala en unos segundos.

⚠️ **Verifica que no se dupliquen identidades.** Tras unir las tres, ejecuta:

```powershell
& "$env:LOCALAPPDATA\Programs\jam\bin\jam.exe" list
```

Deberías ver las mismas identidades de siempre, no `architect-2` ni similares.
Si aparece una duplicada, bórrala con `jam rm --as yanerox69/<handle>` y vuelve a
unir con `jam attach` desde esa ventana, que enlaza a un peer existente sin crear
agente nuevo.

### Paso 4 — arrancar el trabajo

Desde PowerShell, o escribiendo en la sala desde la app:

```powershell
$jam  = "$env:LOCALAPPDATA\Programs\jam\bin\jam.exe"
$room = "01658ca5-794f-4b70-859a-49c7441442b1"
$arch = "3feb21e3-f514-45ef-952d-ef501a48ffbd"
& $jam room send $room "@yanerox69/architect <el brief>" --mention $arch
```

---

## Recuperación

Si cierras una ventana por accidente, **no crees un agente nuevo**. Abre otra
ventana de Claude Code y dile:

```
Reattach this session to the existing architect Jam peer.
```

Eso reenlaza la ventana sin crear identidad en Band. El manual insiste:

> *"Do not create another agent identity when you only need to reconnect the
> existing agent's session."*

Importa porque **Band limita las membresías por agente**: duplicar identidades en
cada reinicio agota la cuota.

## Vigila los procesos huérfanos

Comprobado hoy: Jam no recoge los procesos `claude` al apagarse. Tras un ciclo de
cierre y reapertura quedaban 20 vivos. Cuéntalos de vez en cuando:

```powershell
(Get-Process claude -ErrorAction SilentlyContinue).Count
```

Si se dispara durante el hackathon, cierra todo y arranca limpio.

---

## Cuando lleguen los créditos de Featherless

1. Canjea el código en cuanto llegue el email (primeros 1000 participantes)
2. Vuelve a añadir los dos agentes plegados:
   ```powershell
   & $jam chat add --as yanerox69/architect $room yanerox69/race-hunter yanerox69/regression-guard
   ```
3. Restaura sus roles originales — están en el historial de git de `roles/`, o
   se reconstruyen desde [banda/00-diseno-banda.md](banda/00-diseno-banda.md)
4. Devuelve a `architect` y `spec-warden` sus versiones sin las
   responsabilidades absorbidas
