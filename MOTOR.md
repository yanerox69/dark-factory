# El motor: OpenCode + Featherless

**Verificado el 27-09-2026.** Es la via que usa la fabrica.

```
> build · MiniMaxAI/MiniMax-M2.5
← Write hello.txt      Wrote file successfully.
→ Read hello.txt       Done. Created and verified.
28,3s · hello.txt en disco con "banana"
```

Tool use real contra inferencia de pago, sin capa de traduccion.

## Por que no LiteLLM

Claude Code habla el protocolo Anthropic; Featherless habla OpenAI. El puente
parecia obligatorio, y costo dos dias. No lo es: **OpenCode habla OpenAI de
forma nativa**, y las reglas permiten que los tres asientos compartan harness.

Lo que se probo contra Featherless a traves de LiteLLM, todo fallido:

| Proveedor de LiteLLM | Resultado |
|---|---|
| `featherless_ai/` | enruta a `/v1/responses` -> 404, y **tumba el proxy al arrancar** |
| `openai/` + `api_base` | mismo 404 |
| `openai_like/` | `Unmapped LLM provider for this endpoint` |
| `hosted_vllm/`, `custom_openai/` | sin respuesta |

Verificado con llamadas directas: Featherless **solo** expone
`/v1/chat/completions`. `/v1/responses` da 404.

La configuracion de LiteLLM se conserva por los modelos de Groq y porque las
notas explican el fallo, pero **no esta en la ruta de la fabrica**.

## Montaje

**1. Binario.** El shim que instala npm no arranca en Windows. El real esta en:

```
%APPDATA%\npm\node_modules\opencode-ai\node_modules\opencode-windows-x64\bin\opencode.exe
```

**2. Proveedor** en `~/.config/opencode/opencode.json` — **nunca en el repo**:
OpenCode lee `./opencode.json` del directorio de trabajo, que para un asiento es
el repositorio que entregas, y una clave ahi queda en el historial de Git.

**3. Clave** en `FEATHERLESS_API_KEY` del proceso, derivada de
`DARKFACTORY_FEATHERLESS_KEY`.

**4. Comprobar antes de meter a BAND:**

```powershell
& $exe run -m featherless/MiniMaxAI/MiniMax-M2.5 "Create hello.txt containing the word banana, then read it back."
```

Si `hello.txt` aparece en disco, el asiento va a funcionar.

**5. Servidor y adaptador**, segun la guia del participante (seccion
*Optional: run a seat on OpenCode with Featherless models*):

```powershell
& $exe serve --hostname=127.0.0.1 --port=4096
python opencode-seat.py <nombre-del-asiento>
```

## Modelos disponibles

Los cuatro que ve `opencode models`:

```
featherless/MiniMaxAI/MiniMax-M2.5     <- el verificado
featherless/moonshotai/Kimi-K2.5
featherless/deepseek-ai/DeepSeek-V3.2
featherless/zai-org/GLM-5.2
```

Los tres primeros son los que recomienda la guia. GLM-5.2 es el que sugiere el
PDF de Featherless.

⚠️ El mandate de cada asiento tiene que **empezar** nombrando harness y modelo,
o falla la puerta 1:

```
Harness: OpenCode
Model: MiniMaxAI/MiniMax-M2.5
```