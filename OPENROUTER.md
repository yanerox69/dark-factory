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

### Variables de entorno

```powershell
$k = Read-Host "Pega la clave de OpenRouter"
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://openrouter.ai/api", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $k, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "", "User")
Remove-Variable k
"Configurado"
```

⚠️ **`ANTHROPIC_API_KEY` tiene que quedar vacía**, no sin definir. Si conserva la
clave de Anthropic, Claude Code la usará y volverás al problema del saldo.

🔒 El patrón `Read-Host` evita que la clave quede en el historial de PowerShell.

### Permitir las variables en el runtime de Jam

Los agentes solo ven las variables que estén en su lista blanca:

```
--runtime-env ANTHROPIC_BASE_URL --runtime-env ANTHROPIC_AUTH_TOKEN --runtime-env ANTHROPIC_API_KEY
```

Los agentes actuales se crearon sin esto, así que hay que recrearlos o editar su
runtime desde `Agents → <agente> → Runtime`.

### ⚠️ Y después: reiniciar el daemon

Lección ya aprendida hoy (ver [bitacora.md](bitacora.md)): **`jamd` no se reinicia
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
