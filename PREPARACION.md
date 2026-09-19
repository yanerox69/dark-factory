# Kit de preparación

Índice interno, en español. El [README](README.md) es el público, para los jueces.

Todo lo necesario para llegar al 26 con la fábrica montada y probada, de modo que
el primer día se gaste en construir el producto y no en pelearse con Jam.

## Operación

| Documento | Para qué |
|---|---|
| [FABRICA.md](FABRICA.md) | Estado real: handles, id de sala, y todos los comandos |
| [CHECKLIST-HOY.md](CHECKLIST-HOY.md) | Configuración de Jam y creación de agentes, paso a paso |
| [OPENROUTER.md](OPENROUTER.md) | El motor: modelos gratuitos, límites y configuración |
| [MODO-TERMINAL.md](MODO-TERMINAL.md) | Plan B sin coste de API, con sesiones acopladas |
| [ensayo-general.md](ensayo-general.md) | La prueba de humo y sus 6 criterios |

## Diseño

| Documento | Para qué |
|---|---|
| [banda/00-diseno-banda.md](banda/00-diseno-banda.md) | La banda, el grafo de menciones y el delete test |
| [roles/](roles/) | Los briefs grabados en cada agente |
| [plan.md](plan.md) · [architecture.json](architecture.json) | El plan de sala y su diagrama Arch |

## Entrega

| Documento | Para qué |
|---|---|
| [ENTREGA.md](ENTREGA.md) | Título, descripciones, tags, portada y checklist del formulario |
| [GUION-VIDEO.md](GUION-VIDEO.md) | Escaleta de 4:20 y las capturas que hay que grabar |
| [referencia/reglas-hackathon.md](referencia/reglas-hackathon.md) | Qué hay que entregar y cómo se puntúa |
| [web/index.html](web/index.html) | La página de la fábrica |

## Registro

`bitacora.md` — lo que se probó, lo que falló y por qué. Incluye los tres
bloqueadores que encontró el ensayo general y que habrían costado el primer día
del build.

⚠️ **Fuera del repositorio a propósito.** Vive solo en tu máquina y está en
`.gitignore`: contiene detalles de cuentas, saldos y configuración que no tienen
por qué ser públicos. Si lo necesitas para el caso de estudio del hackathon,
extrae los datos concretos que te pidan en vez de publicarlo entero.

---

## Pista elegida: 💰 pocketful (clon de Venmo)

**Razón:** el invariante es una ley de conservación —la suma de todos los saldos
no cambia nunca— y eso se comprueba con una sola aserción después de cualquier
tormenta de concurrencia. Además evita las zonas horarias, que en la pista de
mesa permean las cuatro etapas y son la familia clásica de bugs que pasan en local
y fallan en el entorno del corrector. El redondeo, en cambio, se resuelve con una
decisión tomada el minuto uno: enteros en unidades mínimas.

### ⚠️ La condición que revierte esta decisión

Si el Discord de BAND dice que **Bolsillo está concurrida y Mesa vacía, cámbiate**.
La estructura de premios pesa más que el ajuste de dominio: basta **1 inscripción
válida** para que se otorgue el primer puesto (4 para el segundo, 6 para el
tercero), y los premios no otorgados **no se redistribuyen**.

La elección de arriba es la correcta *a igualdad de concurrencia*. Los datos la
anulan.

---

## Fechas

| Hito | Hora de Venezuela |
|---|---|
| Preparación | hasta el 25 sep |
| **Inicio del build** | **sábado 26 sep, 12:00 del mediodía** |
| Q&A en Discord | 26 sep, 13:00 |
| **Cierre de entregas** | **domingo 5 oct, 02:59 de la madrugada** |

⚠️ **El cierre es un día antes de lo que parece.** La cabecera de la página dice
`Close 23:59 PDT` junto al rango "Sep 26 – Oct 5", pero el calendario oficial
codifica `20261005T065900Z`, que son las 23:59 PDT del día **4** y las 02:59 del
**5** en Venezuela. El programa del evento coincide con esa hora temprana.

**Tu último día completo de trabajo es el sábado 4.** El desglose está en
[referencia/reglas-hackathon.md](referencia/reglas-hackathon.md).

## Enlaces vivos

| | |
|---|---|
| Repositorio | https://github.com/yanerox69/dark-factory |
| Demo | https://dark-factory-sepia.vercel.app |
| Deck | https://claude.ai/artifact/6TqTryHmhowVmhF7Stwpe9 |
| Página | https://claude.ai/artifact/Rxkwai1kPxWUj9PePND5k2 |

⚠️ Los dos artefactos de Claude son **privados** hasta que los compartas desde su
menú Share, en modo enlace público.

## Deploy

`vercel.json` sirve la carpeta `web/` como raíz del sitio, sin build. Ya está
conectado y desplegando desde `main`.

⚠️ **Durante el build del hackathon hay que cambiarlo.** Cuando exista el producto
de pocketful, `outputDirectory` deja de ser `web` y pasa a ser la carpeta de
salida de la app. La página de la fábrica puede quedarse en una ruta secundaria o
enlazarse desde el repo.

## 🚨 Requisitos nuevos del 19 de septiembre

La página del hackathon se actualizó con requisitos que no existían al montar
esto. El detalle completo está en
[referencia/reglas-hackathon.md](referencia/reglas-hackathon.md). Lo que cambia
para nosotros:

| Cambio | Estado |
|---|---|
| Las mandates no pueden nombrar detalle de pista — **descalifica** | ✅ corregido |
| La pista se llama **pocketful**, no "Bolsillo lleno" | ✅ corregido |
| El vídeo **debe** grabar la sala de BAND — descalifica | ✅ en el guion |
| Repo con `stage-1/` … `stage-4/`, una por etapa | ⏳ durante el build |
| `harness export-room` y `harness check` | ⏳ el harness sale el día 26 |
| El servicio debe arrancar en contenedor limpio **sin red** | ⏳ hay que probarlo |
| Fecha de cierre contradictoria en la propia página | ❓ preguntar en Discord |

**60 de los 100 puntos** son por que la fábrica sea genérica y otro equipo pueda
levantarla. No por el producto.

## Pendiente

- [ ] Compartir los dos artefactos publicados desde su menú Share
- [ ] Importar el repo en Vercel para que la URL de demo exista desde el día 1
- [ ] Borrar `dark-factory-archive` cuando ya no haga falta
- [ ] Confirmar la pista con lo que respondan en el Discord de BAND
- [ ] Canjear los $25 de Featherless en cuanto llegue el correo
- [ ] Rellenar los `[corchetes]` de ENTREGA.md, el deck y la web al cerrar el build
