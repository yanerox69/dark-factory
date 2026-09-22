# OpenRouter como motor de la fábrica

Alternativa a la clave API de Anthropic. OpenRouter expone una **"Anthropic Skin"**
en `https://openrouter.ai/api` que habla el protocolo nativo de Anthropic Messages,
con paso de bloques de razonamiento extendido y **tool use nativo** — que es lo que
los agentes necesitan para editar ficheros y ejecutar el gate.

No hace falta proxy local.

---

## Límites — léelo antes de nada

| | Peticiones/min | Peticiones/día |
|---|---|---|
| Sin comprar créditos | 20 | **50** |
| Con $10 comprados (una sola vez, de por vida) | 20 | **1.000** |

El límite elevado entra a partir de **$9** acumulados históricos, no de $10.

**50/día no basta para la fábrica.** Cada ciclo de uso de herramienta es una
petición, así que un turno del architect escribiendo un SPEC consume decenas.
Sirve para *validar el montaje*, no para construir.

**1.000/día sí funciona** para una banda de tres. Es una compra única que no
caduca — a diferencia de los créditos de Anthropic, que se consumen.

---

## Modelos gratuitos con tool use

| ID | Contexto | Nota |
|---|---|---|
| `nex-agi/nex-n2.5-pro:free` | 262K | Construido para codificación agéntica: explora repos, cambios multi-fichero, ejecuta comandos, prueba y se autocorrige |
| `nex-agi/nex-n2.5-mini:free` | 262K | Versión ligera |
| `inclusionai/ling-3.0-flash-vl:free` | 262K | Tool calling, #49 en programación |
| `inclusionai/ling-3.0-flash-fin:free` | 262K | **#34 en programación** |

**Asignación sugerida para la banda de tres:**

| Rol | Modelo | Por qué |
|---|---|---|
| `builder` | `nex-agi/nex-n2.5-pro:free` | Es el que escribe código |
| `spec-warden` | `inclusionai/ling-3.0-flash-fin:free` | Verificación y tests, mejor puesto en programación |
| `architect` | `nex-agi/nex-n2.5-pro:free` | Planificación y gate |

---

## Configuración

### 🚨 No pongas las variables `ANTHROPIC_*` a nivel de usuario

Se intentó y fue un error. Esas variables **secuestran cualquier Claude Code de
la máquina**, incluida tu propia sesión: el modelo queda apuntando a OpenRouter y
las operaciones que usan el modelo rápido empiezan a fallar con
`There's an issue with the selected model`.

**Usa [`iniciar-fabrica.ps1`](iniciar-fabrica.ps1)**, que las define solo para el
proceso que arranca Jam. Los agentes las heredan vía el daemon y nada más las ve.

```powershell
.\iniciar-fabrica.ps1
```

El script comprueba antes que Jam esté completamente parado —si el daemon sigue
vivo hereda el entorno viejo y no aplica nada— y aborta avisando si no.

### La clave

Vive a nivel de usuario como **`DARKFACTORY_OPENROUTER_KEY`**, un nombre que no
colisiona con nada. Para cambiarla sin que quede en el historial:

```powershell
$k = Read-Host "Clave"; [Environment]::SetEnvironmentVariable("DARKFACTORY_OPENROUTER_KEY",$k,"User"); Remove-Variable k
```

⚠️ **`ANTHROPIC_API_KEY` tiene que quedar vacía**, no con un valor viejo. Si
Claude Code encuentra una clave de Anthropic, la usa y se ignora OpenRouter. El
script ya lo hace.

### ⚠️ Y después: reiniciar el daemon

Lección ya aprendida a base de perder una tarde: **`jamd` no se reinicia
al cerrar la ventana de Jam**. Sin esto, los runtimes heredan el entorno viejo y
fallan en silencio con turnos de un segundo.

1. Cerrar Jam Desktop del todo, bandeja incluida
2. `jam daemon stop` — tarda ~25 s
3. Reabrir Jam Desktop desde el menú de inicio

---

## El riesgo que hay que probar

La propia documentación de OpenRouter avisa:

> *"Claude Code is optimized for Anthropic models and may not work correctly with
> other providers."*

Traducción: el bucle agéntico puede degradarse con modelos no-Anthropic. Los
síntomas a vigilar son llamadas a herramientas malformadas, el agente que no
encadena pasos, o que ignore las instrucciones de rol.

**Prueba de validación mínima** (cabe de sobra en 50 peticiones/día):

```powershell
$jam  = "$env:LOCALAPPDATA\Programs\jam\bin\jam.exe"
$room = "01658ca5-794f-4b70-859a-49c7441442b1"
$arch = "3feb21e3-f514-45ef-952d-ef501a48ffbd"
& $jam room send $room "@yanerox69/architect Create a file called PING.md in the workspace root containing the single word pong, then reply in this room confirming you created it." --mention $arch
```

Si aparece `PING.md` **y** el agente responde en la sala, el tool use sobrevive el
viaje y el montaje es válido. Si escribe el fichero pero no responde, o responde
sin escribirlo, el bucle agéntico está degradado.

### ✅ Resultado: pasada el 18 de septiembre de 2026

**El riesgo no se materializó.** El log de la sala tiene el turno completo, de
punta a punta en 18 segundos:

```
21:18:13  [tool_call]   Glob  → busca PING.md
21:18:15  [tool_result] "No files found"
21:18:18  [tool_call]   Write → PING.md con "pong"
21:18:20  [tool_result] "File created successfully"
21:18:23  [tool_call]   mcp__jam__jam_reply_to_message
21:18:31  [text]        "Created PING.md ... with the single word pong."
21:18:31  [task]        turn_complete · outcome: complete
```

Los dos criterios se cumplen: escribió el fichero **y** respondió en la sala.
Encadenó tres pasos sin perderse y eligió bien la herramienta de respuesta.

Por el estilo telegráfico de los bloques `[thought]` y el formato de los
`tool_call_id`, el turno no lo sirvió un modelo de Anthropic. Es decir: el aviso
de la documentación de OpenRouter —*«Claude Code is optimized for Anthropic
models»*— **no se cumplió en la práctica** para esta tarea. No es prueba de que
aguante una etapa entera, pero el tool use básico y el encadenado sobreviven.

### ❌ Reintento del 22 de septiembre: no llegó a correr

Se repitió el mismo envío con los cinco peers en `Stopped running=false`. El
mensaje entró en la sala, el `architect` **no despertó**, no se creó `PING.md`
y no hubo error en ninguna parte.

No invalida el resultado del 18: mide otra cosa. Lo que demuestra es que **una
mención no arranca un runtime parado**, y que el fallo es silencioso. Está
documentado en [FABRICA.md](FABRICA.md), sección «Cuando la banda está parada».

---

## Comparación de las tres vías

| Vía | Coste | Capacidad | Estado |
|---|---|---|---|
| Anthropic API | por uso | alta | ❌ sin saldo |
| **OpenRouter gratis** | **$0** | 50 peticiones/día | ✅ disponible ya, solo para validar |
| **OpenRouter + $10 único** | $10 de por vida | 1.000 peticiones/día | 💡 mejor relación valor/coste |
| Featherless | $0 (patrocinador) | $25 en créditos | ⏳ código por email antes del 26 |
| Terminal acoplado | $0 | la de tu sesión | ✅ disponible, sin probar |

**Recomendación:** valida el montaje con OpenRouter gratis ahora, canjea
Featherless en cuanto llegue, y si puedes reunir $10 en algún momento, esa compra
única te resuelve el hackathon entero.
