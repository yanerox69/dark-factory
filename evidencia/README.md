# evidencia/

Evidence from the build, kept in the repository so a reviewer can check the
claims rather than take them on trust.

Nothing here is source code, and nothing here is graded. It exists because the
factory's central claim — that the agents plan, implement and check their own
results — is only worth what the traces behind it are worth.

## What goes here

| Kind | Naming | Notes |
|---|---|---|
| Room traces and mention handoffs | `stage-N-traza.md` | Exported from the room, one file per stage |
| Rejections | `stage-N-rebotes.md` | Expected-versus-actual for each bounce back to the builder |
| Screenshots | `stage-N-<asunto>.png` | The room working; source material for the video |
| Gate output | `stage-N-gate.txt` | Run independently, not copied from an agent's own report |
| Clean-container check | `stage-N-contenedor.txt` | `docker run --network none …`, including the failure if it failed |
| Cost and request count | `costes.md` | Requests spent per phase; the real ceiling is requests, not tokens |
| Room export | `sala-export.json` | From `harness export-room`, due on day 5 |

## What does not go here

- **Secrets of any kind.** This repository is public, and room activity is set to
  `full`, so every participant sees those events. Check before pasting a trace.
- Anything that only flatters the run. A retracted finding or a failed container
  check is worth more than a clean log: it shows the gate actually bites.

## Convention

One file per stage per kind, named for the stage it belongs to. A file that does
not say which stage it came from cannot be checked against anything.
