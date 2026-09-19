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

## Pista elegida: 💰 Bolsillo lleno (clon de Venmo)

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

| Hito | Cuándo |
|---|---|
| Preparación | hasta el 25 sep |
| **Inicio del build** | **26 sep, 09:00 PDT** |
| **Cierre** | **5 oct, 23:59 PDT** |

⚠️ Convierte ambas a tu zona horaria y ponlas en el calendario. El cierre en PDT
puede caer de madrugada del día siguiente donde estés.

## Pendiente

- [ ] Compartir los dos artefactos publicados desde su menú Share
- [ ] Deploy en Vercel para que la URL de demo exista desde el día 1
- [ ] Confirmar la pista con lo que respondan en el Discord de BAND
- [ ] Canjear los $25 de Featherless en cuanto llegue el correo
- [ ] Rellenar los `[corchetes]` de ENTREGA.md, el deck y la web al cerrar el build
