# Groq como motor de la fábrica

Tercera vía de inferencia, junto a [OPENROUTER.md](OPENROUTER.md) y
[MODO-TERMINAL.md](MODO-TERMINAL.md). La diferencia: **es gratis y no pide
tarjeta.**

Encontrada el 23 de septiembre de 2026 en la lista de
[public-apis](https://github.com/public-apis/public-apis), categoría *Machine
Learning*, entre 1.902 entradas.

## Por qué

| | Groq (gratis) | OpenRouter ($11) |
|---|---|---|
| Peticiones/día | **~1.000** ⚠️ verificar | 1.000 |
| Coste | **$0** | $11 una vez |
| Tarjeta | **no pide** | obligatoria |
| Tool calling | sí, en el tramo gratuito | sí |
| Peticiones/minuto | **30** | 20 |

Es el mismo caudal que el tramo de pago de OpenRouter, sin pagar y sin el lío
de cargar una prepago desde Venezuela.

⚠️ **Verifica tu límite real** en https://console.groq.com/settings/limits. Las
fuentes públicas dan cifras distintas (1.000 y 14.400 peticiones/día) y varía
por modelo. El número que vale es el de tu cuenta.

## La pieza que falta: LiteLLM

Groq habla **formato OpenAI**. Claude Code habla **Anthropic Messages**. No
encajan directos, así que en medio va LiteLLM, que sirve `/v1/messages` en
formato Anthropic y traduce:

```
Agentes Jam (Claude Code)
   └─ ANTHROPIC_BASE_URL → LiteLLM (Docker, local, gratis)
                              └─ traduce → Groq
```

LiteLLM no aporta capacidad, aporta traducción. La capacidad la pone Groq.

## Puesta en marcha

### 1. La clave

Sácala en **https://console.groq.com/keys** — registro sin tarjeta. Luego:

```powershell
$k = Read-Host "Clave"; [Environment]::SetEnvironmentVariable("DARKFACTORY_GROQ_KEY",$k,"User"); Remove-Variable k
```

Mismo patrón que `DARKFACTORY_OPENROUTER_KEY`: a nivel de usuario, con un
nombre que no colisiona, y nunca dentro del repo.

### 2. El proxy

Necesita **Docker Desktop abierto**, no solo instalado.

```powershell
.\iniciar-litellm.ps1
```

Déjalo en su ventana. Escucha en `http://127.0.0.1:4000`, solo loopback.

### 3. La fábrica

En otra ventana:

```powershell
.\iniciar-fabrica-groq.ps1
```

Comprueba que el proxy responde antes de arrancar Jam, y exige —igual que
`iniciar-fabrica.ps1`— que Jam esté completamente parado, daemon incluido.

## Modelos

| Alias | Modelo de Groq | Contexto | Para qué |
|---|---|---|---|
| `factory-main` | `openai/gpt-oss-120b` | 131K | Escribir código y planificar |
| `factory-fast` | `openai/gpt-oss-20b` | 131K | El modelo rápido de Claude Code |
| `factory-alt` | `qwen/qwen3.8-27b` | 131K | Reserva |

Para cambiar el principal, edita `ANTHROPIC_MODEL` en
[iniciar-fabrica-groq.ps1](iniciar-fabrica-groq.ps1).

⚠️ **La ficha de public-apis está desactualizada.** Dice que Groq sirve «Llama,
Mixtral, Gemma» y esta cuenta **no tiene ninguno de los tres**. Consultado
`/v1/models` el 23-09-2026, lo único con contexto grande son los dos GPT-OSS y
el Qwen de arriba; el resto son Whisper, Orpheus, guardarraíles y un modelo
árabe de 4K. Si necesitas la lista real:

```powershell
$k = [Environment]::GetEnvironmentVariable('DARKFACTORY_GROQ_KEY','User')
(Invoke-RestMethod 'https://api.groq.com/openai/v1/models' -Headers @{Authorization="Bearer $k"}).data |
  Select-Object id, context_window | Sort-Object id
```

## ⚠️ La trampa del `max_tokens` con modelos de razonamiento

`gpt-oss-120b` razona antes de escribir, y **ese razonamiento consume del mismo
presupuesto de salida**. Con `max_tokens` bajo, el modelo agota el presupuesto
pensando y devuelve un bloque de texto **vacío** con `stop_reason: max_tokens`.

Visto en la primera prueba: con `max_tokens: 64`, exactamente 64 tokens de
salida y texto vacío. Con 2048, respondió `pong` y `stop_reason: end_turn`.

No hay error, no hay aviso: solo contenido vacío. Si un agente devuelve turnos
en blanco, mira esto antes que nada.

## ✅ Verificado el 23 de septiembre de 2026

Probado de punta a punta contra el proxy, no sobre el papel:

| Qué | Resultado |
|---|---|
| El proxy sirve `/v1/messages` en formato Anthropic | ✅ |
| El id `groq/openai/gpt-oss-120b` resuelve (doble prefijo) | ✅ |
| Respuesta completa Anthropic → Groq → Anthropic | ✅ `end_turn`, devolvió `pong` |
| **Tool use traducido en los dos sentidos** | ✅ **los tres modelos** |

La prueba de tool use mandó una herramienta `write_file` en formato Anthropic.
Los tres alias devolvieron `stop_reason: tool_use` con el nombre correcto y los
argumentos bien formados:

```
factory-main  →  write_file {"content":"pong","path":"PING.md"}
factory-fast  →  write_file {"content":"pong","path":"PING.md"}
factory-alt   →  write_file {"content":"pong","path":"PING.md"}
```

Era el riesgo mayor: que Groq soporte tool calling y que LiteLLM lo traduzca
bien entre formatos Anthropic y OpenAI son cosas distintas. Las dos se cumplen.

## 🚫 El bucle agéntico NO funciona — probado el 24-09-2026

Todo lo verde de arriba son **llamadas sueltas**. Con el `architect` corriendo y
la prueba del `PING.md` lanzada de verdad, el turno falla siempre:

```
API Error: 400 litellm.BadRequestError: GroqException -
{"error":{"message":"'messages.109' : for 'role:assistant' the following must be
satisfied[('messages.109' : property 'reasoning_content' is unsupported)]",
"type":"invalid_request_error"}}
```

### La causa

Los modelos de razonamiento devuelven `reasoning_content` como campo aparte.
Claude Code lo guarda en el historial y lo reenvía en el turno siguiente, y
**Groq rechaza ese mismo campo al recibirlo**. Por eso las pruebas de una sola
llamada pasan: sin historial que reenviar no hay nada que rechazar.

No es un fallo de esta configuración. Es una incompatibilidad conocida aguas
arriba, con el mismo error reportado en Spring AI, Vercel AI SDK, gptel y Jan.

### Por qué no se arregla cambiando de modelo

**Los tres modelos de contexto grande de esta cuenta razonan** —los dos GPT-OSS
y el Qwen—. El resto son Whisper, Orpheus, guardarraíles y un modelo de 4K. No
hay a dónde cambiar dentro de Groq.

### Por qué no bastó `merge_reasoning_content_in_choices`

Se añadió a `factory-main` y **no resolvió**: evitaría el problema en un hilo
limpio, pero el historial del `architect` ya tenía el campo grabado en
`messages.109` de los intentos anteriores. Se queda en la config porque es
correcta para un hilo nuevo.

### Y la reparación es circular

```
jam runtime compact --as yanerox69/architect
  → error: This agent is paused. Send a message to wake it or restart the session.
```

Para compactar el contexto hay que despertar al agente; despertarlo dispara el
turno que falla con el historial envenenado.

### El matiz que importa

**El historial no está roto: es incompatible con Groq.** Ese campo solo lo
rechaza Groq. Este mismo `architect`, con este mismo historial creciendo,
completó el PING el 18 de septiembre vía OpenRouter — ver
[OPENROUTER.md](OPENROUTER.md). Volver allí no arrastra este problema.

### Veredicto

**Groq no sirve para un agente que ya tiene historial.** Si se retoma, la prueba
limpia es con un **agente nuevo**, sin contaminar, para ver si
`merge_reasoning_content_in_choices` resuelve el caso de verdad. Eso no se hace
a dos días del arranque.

## ⚠️ Lo que sigue sin probar

1. **Un hilo limpio con la opción de fusión activa.** Es la única pregunta viva
   sobre esta ruta, y necesita un agente recién creado.
2. **30 peticiones/minuto sostenidas.** Techo estrecho para cinco agentes en
   paralelo. Sin medir bajo carga real.
3. **Calidad en una etapa entera.** Que elija bien una herramienta en un caso de
   juguete no dice cómo se comporta en cuatro horas de trabajo.

## Comprobaciones

**El proxy está vivo:**

```powershell
Invoke-RestMethod http://127.0.0.1:4000/health/liveliness
```

**El modelo responde de punta a punta**, en formato Anthropic:

```powershell
$h = @{ 'x-api-key' = 'sk-darkfactory-local'; 'anthropic-version' = '2023-06-01' }
$b = @{ model = 'factory-main'; max_tokens = 64; messages = @(@{ role='user'; content='Say pong' }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri http://127.0.0.1:4000/v1/messages -Method Post -Headers $h -ContentType 'application/json' -Body $b
```

Si eso devuelve texto, la traducción funciona y el montaje es válido.

**El bucle agéntico**: la prueba del `PING.md` de [OPENROUTER.md](OPENROUTER.md).
Es la que decide de verdad, porque mide tool use y encadenado, no solo que el
modelo conteste.

⚠️ Recuerda: una mención no arranca un runtime parado. Comprueba `jam list`
antes de mandar la tarea — ver [FABRICA.md](FABRICA.md).
