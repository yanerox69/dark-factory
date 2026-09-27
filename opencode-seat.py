"""Conecta un asiento de OpenCode (con modelos de Featherless) a una sala de Band.

Es el paso 5 de la guia del participante, seccion "Optional: run a seat on
OpenCode with Featherless models".

Por que existe esta via: Claude Code exige plan de pago o saldo de API. OpenCode
no, y habla formato OpenAI de forma nativa, asi que Featherless encaja sin
traductor de por medio. LiteLLM perdia las herramientas al traducir; aqui no hay
nada que traducir.

Uso:

    python opencode-seat.py <nombre-del-asiento> [--model <id>] [--dir <ruta>]

Requisitos previos:

  1. `opencode serve --hostname=127.0.0.1 --port=4096` corriendo en otra ventana
  2. FEATHERLESS_API_KEY definida en el entorno
  3. El YAML de identidad del asiento, FUERA de este repositorio

Sobre el YAML: `load_agent_config` lee la identidad y la clave del agente de
Band. Ese fichero NO va en el repo — el repo es publico y una clave commiteada
queda en el historial para siempre.

Por defecto `load_agent_config` busca `agent_config.yaml` en el DIRECTORIO DE
TRABAJO, lo que significa que arrancar el asiento desde este repo dejaria la
clave a un `git add` de distancia. Por eso la ruta se pasa explicita y el script
se niega a leer un YAML que este dentro de este repositorio.
"""

import argparse
import asyncio
import os
import sys

from band import Agent, Emit
from band.adapters import OpencodeAdapter, OpencodeAdapterConfig
from band.config import load_agent_config

# El repositorio de resultado. La guia insiste en pasar la ruta ABSOLUTA: un
# asiento trabaja en su propio sandbox, no resuelve rutas relativas, y acabaria
# creando un repositorio que solo el ve.
# Repo limpio y separado, como manda la guia: "Keep the result repository
# separate from the challenge package and factory inputs". Este repo NO es
# dark-factory — aquel guarda la preparacion, el ensayo y los materiales.
DIRECTORIO_RESULTADO = r"C:\Users\Yanero\Desktop\band-work\result"

# GLM-5.2 es el que recomienda la guia de Featherless para codigo, y el unico
# que hemos visto escribir ficheros de verdad en esta maquina. Las alternativas
# verificadas en la cuenta: MiniMaxAI/MiniMax-M2.5, moonshotai/Kimi-K2.5,
# deepseek-ai/DeepSeek-V3.2.
MODELO_POR_DEFECTO = "zai-org/GLM-5.2"

SERVIDOR = "http://127.0.0.1:4096"

# Un nivel por encima de `result/`, para que ningun `git add` de ningun repo lo
# alcance. Es el fichero que `load_agent_config` lee en formato por clave:
#
#     <asiento>:
#       agent_id: "..."
#       api_key: "..."
IDENTIDADES = r"C:\Users\Yanero\Desktop\band-work\agent_config.yaml"

ESTE_REPO = os.path.dirname(os.path.abspath(__file__))


def main() -> int:
    p = argparse.ArgumentParser(description="Arranca un asiento de OpenCode en Band")
    p.add_argument("asiento", help="nombre del asiento, tal y como esta en su YAML")
    p.add_argument("--model", default=MODELO_POR_DEFECTO)
    p.add_argument("--dir", default=DIRECTORIO_RESULTADO)
    p.add_argument("--url", default=SERVIDOR)
    p.add_argument("--config", default=IDENTIDADES, help="YAML de identidades")
    args = p.parse_args()

    if not os.environ.get("FEATHERLESS_API_KEY"):
        print("FALTA FEATHERLESS_API_KEY en el entorno.", file=sys.stderr)
        return 1

    if not os.path.isabs(args.dir):
        print(f"La ruta del resultado debe ser absoluta: {args.dir}", file=sys.stderr)
        return 1

    config = os.path.abspath(args.config)
    if os.path.commonpath([config, ESTE_REPO]) == ESTE_REPO:
        print(
            f"El YAML de identidades esta DENTRO de este repositorio:\n  {config}\n"
            "Muevelo fuera. Este repo es publico.",
            file=sys.stderr,
        )
        return 1

    agent_id, api_key = load_agent_config(args.asiento, config_path=config)

    adapter = OpencodeAdapter(
        config=OpencodeAdapterConfig(
            base_url=args.url,
            directory=args.dir,
            provider_id="featherless",
            model_id=args.model,
            # Por defecto es "manual", que deja cada llamada a herramienta
            # esperando una respuesta humana y bloquea el turno. El run que se
            # juzga tiene que ser desatendido, asi que no hay alternativa.
            # Implica que este asiento ejecuta comandos sin preguntar.
            approval_mode="auto_accept",
            # El defecto son 300 s. La guia mide 16-41 s para editar un fichero
            # con estos modelos, asi que cinco minutos corta turnos reales.
            turn_timeout_s=900,
        ),
        emit={Emit.TOOL_CALLS, Emit.TASK_EVENTS},
    )

    print(f"asiento   : {args.asiento}")
    print(f"modelo    : featherless/{args.model}")
    print(f"directorio: {args.dir}")
    print(f"servidor  : {args.url}")
    print(f"identidad : {config}")
    print("conectando a Band...")

    agent = Agent.create(adapter=adapter, agent_id=agent_id, api_key=api_key)
    asyncio.run(agent.run())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
