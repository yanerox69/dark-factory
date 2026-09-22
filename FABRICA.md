# Estado de la fábrica

Valores reales. Todo esto ya existe en tu cuenta BAND.

## Identidad

| | |
|---|---|
| Cuenta | Jose Miranda `@yanerox69` |
| User id | `6c05036a-e7f6-41dd-9f7d-9e3264e32d82` |
| Workspace | `C:\Users\Yanero\Desktop\dark-factory` |
| CLI | `%LOCALAPPDATA%\Programs\jam\bin\jam.exe` (v0.4.10) — ⚠️ ver abajo, hay tres copias |

## ⚠️ Antes de cualquier comando: el daemon y el CLI

Dos trampas del PATH que bloquean **todo** el CLI y cuyos mensajes de error
apuntan al sitio equivocado. Comprobadas el 22 de septiembre de 2026.

### 1. Abre Jam Desktop primero — el daemon no se auto-arranca

`jam.exe` está en `Programs\jam\bin\`, que sí está en el PATH, pero `jamd.exe`
está en `%LOCALAPPDATA%\jam\`, que **no**. Con Jam Desktop cerrado, el CLI
intenta levantar el daemon, no lo encuentra, y corta con:

```
daemon auto-start failed: spawning jamd.exe: program not found
```

No es una instalación rota. **Abre Jam Desktop antes de tocar el CLI** y el
daemon queda arriba. Se verifica con `jam daemon status` → `daemon running`.

### 2. No metas `%LOCALAPPDATA%\jam` en el PATH

Parece la solución obvia a lo anterior. No lo es: hay **tres `jam.exe` idénticos**
—mismo tamaño, misma fecha— y solo uno es el CLI que el daemon acepta.

| Ruta | Qué es |
|---|---|
| `%LOCALAPPDATA%\Programs\jam\bin\jam.exe` | ✅ **el gestionado** (`target` en `cli-install.json`) |
| `%LOCALAPPDATA%\jam\bin\jam.exe` | el hook |
| `%LOCALAPPDATA%\jam\jam.exe` | la copia interna de la app |

Si pones esa carpeta delante en el PATH, `jam` pasa a resolver a la copia de la
app y el preflight corta con:

```
terminal `jam` is not the managed CLI — install or repair it from the desktop app
```

El mensaje sugiere reinstalar, pero **no hay nada que reparar**: es solo el orden
del PATH. Comprueba cuál resuelve con `(Get-Command jam).Source` y, si no es el
de `Programs\jam\bin`, quita la otra carpeta del PATH en vez de reinstalar.

El registro de cuál es el bueno vive en `%LOCALAPPDATA%\jam\cli-install.json`,
campo `target`.

## Sala

```
01658ca5-794f-4b70-859a-49c7441442b1
```

Participantes: los 5 agentes + tú (`yanerox69`, como miembro; `architect` es owner
de la sala).

## La banda — configuración actual: 3 activos

⚠️ Reducida a tres por falta de saldo de API. Ver [MODO-TERMINAL.md](MODO-TERMINAL.md).

**En la sala:**

| Handle | `--session` | Rol | Implementa |
|---|---|---|---|
| `@yanerox69/architect` | `architect` | Planifica, revisa, decide, **+ gate de regresión** | No |
| `@yanerox69/spec-warden` | `spec-warden` | Conformidad literal **+ ataque de concurrencia** | No |
| `@yanerox69/builder` | `builder` | API JSON + UI web | **Sí** |

**Fuera de la sala, identidad conservada** (readmitir cuando lleguen créditos):

| Handle | Rol original |
|---|---|
| `@yanerox69/race-hunter` | Concurrencia, idempotencia, entradas malformadas |
| `@yanerox69/regression-guard` | Suite dorada + gate completo |

```powershell
# para recuperar la banda de cinco
& $jam chat add --as yanerox69/architect $room yanerox69/race-hunter yanerox69/regression-guard
```

Instrucciones de rol grabadas de forma persistente desde `roles/*.md`
(se aplican en el siguiente spawn/wake).

## Lo que ya está publicado en la sala

- `architecture.json` — diagrama Arch JSON de la fábrica (snapshot inmutable, 2408 B)
- `plan.md` — plan activo de la sala (snapshot inmutable, 5356 B)

## ⚠️ Las dos autenticaciones

Confundirlas cuesta horas. Son independientes:

| | Qué da | Dónde se ve |
|---|---|---|
| **Cuenta BAND** | Identidad de los agentes, sala, mensajería | `Settings → Account`, `jam whoami` |
| **Proveedor de código** | Capacidad de razonar y trabajar | El error aparece en la sala al primer turno |

Una cuenta BAND conectada **no** implica que los agentes puedan trabajar. Si en
la sala ves `Claude Code is not signed in` o equivalente, el problema es el
proveedor, no BAND.

**Requisito del proveedor:** el login por suscripción de Claude Code exige
**Pro o Max**. Sin eso, la vía es clave API:

```powershell
# el valor lo pone el dueño, nunca se pega en un chat ni se commitea
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "<clave>", "User")
```

y los agentes se crean con:

```
--runtime-auth api_key --runtime-env ANTHROPIC_API_KEY
```

Pon un **límite de gasto** en la Consola antes de arrancar: cinco agentes en
paralelo consumen rápido.

## Comandos que vas a repetir

Define primero el atajo en PowerShell:

```powershell
$jam  = "$env:LOCALAPPDATA\Programs\jam\bin\jam.exe"
$room = "01658ca5-794f-4b70-859a-49c7441442b1"
$ws   = "C:\Users\Yanero\Desktop\dark-factory"
```

### Estado

```powershell
& $jam preflight                          # salud general
& $jam list                               # peers y si están conectados
& $jam sessions --as yanerox69/architect  # sesiones de un agente
& $jam doctor                             # diagnóstico
```

### Sala

```powershell
& $jam --session architect chat participants $room
& $jam room messages $room                # leer como humano
& $jam room send $room "@yanerox69/architect <mensaje>"
```

### Trabajo

```powershell
& $jam work board $room                   # tablero compartido
& $jam work assign $room "<asunto>"       # crear tarea compartida
```

### Plan (re-publicar tras editar)

⚠️ Siempre `--snapshot`. Para publicar una edición hay que **re-ejecutar**
`plan set` / `plan diagram`. `plan refresh` **no** sirve con snapshots: relee la
copia almacenada, no tu fichero.

```powershell
& $jam plan diagram --as yanerox69/architect $room --file "$ws\architecture.json" --label "Architecture" --snapshot
& $jam plan set     --as yanerox69/architect $room "$ws\plan.md" --label "Plan" --snapshot
& $jam plan show    --as yanerox69/architect $room
```

### Evidencia y coste

```powershell
& $jam artifact files --room $room --json    # catálogo de ficheros
& $jam usage                                 # tokens y coste estimado
& $jam stats                                 # totales de actividad
```

### Cambiar un rol

```powershell
& $jam agent instructions set  --as yanerox69/builder --instructions-file "$ws\roles\builder.md"
& $jam agent instructions show --as yanerox69/builder
```

### Recuperación

```powershell
& $jam restart --as yanerox69/builder     # reiniciar un runtime atascado
& $jam stop    --as yanerox69/builder     # parar sin borrar identidad
& $jam inbox   --as yanerox69/architect   # mensajes en cola
& $jam reconcile                          # peers locales vs Band
```

### Borrar todo (si hay que empezar de cero)

```powershell
& $jam rm --as yanerox69/<handle>         # borra el agente Band y su registro
```

⚠️ `jam reset` borra **todos** los datos locales con crypto-erase irreversible.
No lo uses salvo desastre.

## Reglas que no puedes olvidar

1. **Una mención despierta; añadir a la sala no.** Sin `@handle` el mensaje no
   llega a nadie. Escribe el handle como token suelto, sin puntuación pegada.
2. **No cablees el destinatario siguiente** en la instrucción del anterior. Cada
   agente consulta los participantes y menciona él mismo al siguiente.
3. **Home → "Assign work" crea una sala nueva cada vez.** Tu fábrica vive en
   `01658ca5…`. No la fragmentes.
4. **Un agente no puede aprobar el permiso de otro.** Esa es la limitación
   declarada; los permisos genuinos los apruebas tú.
5. **Una sesión deja de contar como viva tras 45 s de silencio** y vuelve sola al
   contestar. No crees identidad nueva.
6. **Nunca mates un monitor por nombre de proceso.** Cross-mata los de las
   sesiones hermanas.
