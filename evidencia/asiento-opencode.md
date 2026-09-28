# Un asiento de OpenCode en una sala de Band — verificado

Fecha: 27 de septiembre de 2026

Cierra la última incógnita del montaje: que un asiento movido por **OpenCode +
Featherless** se comporte como un peer de Band de verdad —despierte con una
mención, use herramientas, escriba en disco y responda en la sala— **sin nadie
delante**.

Es el mismo test de dos criterios de [OPENROUTER.md](../OPENROUTER.md), ahora por
la vía que sí tiene caudal.

---

## ✅ Resultado: pasa

Sala `c895290d-22e6-4e08-a8e2-f02377c8b31d`, dos participantes: el usuario y
`yanerox69/factory-probe`.

El brief enviado por mención:

> *Create a file called MOTOR-OK.md in the workspace root containing the single
> line 'opencode seat verified', then reply in this room confirming you created
> it.*

Lo que registró el asiento:

```
Started local MCP server band on 127.0.0.1:56702 with 7 tools
MCP server band_15cff372 registered with OpenCode (status=connected)
POST  /session                                    200
POST  /agent/chats/<sala>/events                  201
OpenCode turn: prompt_async start   session=ses_f1bbb23b2ffeo1TDJ2fv5MB1V4
OpenCode turn: watcher started      timeout=900.0s
Processing request of type CallToolRequest
POST  /agent/chats/<sala>/messages                201
OpenCode turn: session.idle
OpenCode turn: delivering fallback  (text=76 chars, error=False, replied_via_tool=True)
POST  /agent/chats/<sala>/messages/<id>/processed 200
ExecutionContext <sala>: Synchronized, switching to WebSocket
```

En disco: `MOTOR-OK.md`, 22 bytes, con `opencode seat verified`.

| Criterio | |
|---|---|
| Escribió el fichero pedido, con el contenido exacto | ✅ |
| Respondió en la sala | ✅ `replied_via_tool=True` |
| Cerró el turno limpio | ✅ `session.idle`, mensaje `processed` |
| Herramientas de Band disponibles | ✅ 7 por MCP, `status=connected` |
| Desatendido | ✅ `approval_mode="auto_accept"`, cero intervención |

El fichero se retiró luego del repo de entrega: era artefacto de prueba, no
entregable.

---

## 🔑 El hallazgo que cambia el montaje

**La sala no necesita a Jam.** `jam chat new --with yanerox69/factory-probe`
falla con `error: peer not found`: el CLI de Jam solo conoce sus propios peers, y
un agente externo no lo es.

Pero la API REST de Band expone todo lo necesario con la clave de usuario:

| Llamada | Para qué |
|---|---|
| `human_api_chats.create_my_chat_room` | crear la sala |
| `human_api_participants.add_my_chat_participant` | sentar cada asiento |
| `human_api_messages.send_my_chat_message` | enviar el brief con `mentions` |
| `human_api_participants.list_my_chat_participants` | comprobar quién está |

Consecuencia: la fábrica **no depende del plugin de Claude Code de Jam**, que es
justo el que lleva días avisando *«Claude plugin did not converge»*. Ese aviso
dejó de importar.

---

## 🚨 La clave del agente se acuña UNA sola vez

`register_my_agent` devuelve `credentials.api_key` en el cuerpo de la respuesta y
**no hay forma de volver a pedirla**. La fuente de `band.docker.provision` lo
dice en un comentario, y yo lo aprendí a base de perder una:

Un `print` que tocaba un campo inexistente (`agent.slug`, que no existe en
`MyAgentCredentialsAgent`) lanzó `AttributeError` **después** del registro y
**antes** de guardar. El agente `coordinator` quedó creado y sin clave: inútil.
Hubo que borrarlo para liberar el nombre y registrarlo de nuevo.

**La regla:** persistir la credencial en disco **antes** de imprimir, loguear o
formatear cualquier cosa. En el script de registro, `save(out)` va inmediatamente
después de la llamada, sin nada en medio.

---

## Cómo reproducirlo

```powershell
# 1. Servidor de OpenCode, en el directorio del resultado
$oc = "$env:APPDATA\npm\node_modules\opencode-ai\node_modules\opencode-windows-x64\bin\opencode.exe"
& $oc serve --hostname=127.0.0.1 --port=4096

# 2. El asiento, en otra ventana
$env:FEATHERLESS_API_KEY = [Environment]::GetEnvironmentVariable("FEATHERLESS_API_KEY","User")
python -u opencode-seat.py coordinator
```

⚠️ Con `python` sin `-u` la salida queda bufferizada y el asiento **parece
colgado** cuando en realidad está conectado. Costó dos vueltas averiguarlo.

Las identidades viven en `C:\Users\Yanero\Desktop\band-work\agent_config.yaml`,
fuera de todo repositorio. `opencode-seat.py` aborta si el YAML que se le pasa
cae dentro de este repo.
