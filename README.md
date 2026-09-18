# Fábrica Oscura de IA — WeAreDevelopers x BAND

Kit de preparación para el hackathon **Dark Factory** (26 sep – 5 oct 2026).

## Qué es esto

Todo lo necesario para llegar al día 26 con la fábrica montada y probada, de modo
que el primer día se gaste en construir el producto y no en pelearse con Jam.

## Orden de trabajo para HOY

1. **[CHECKLIST-HOY.md](CHECKLIST-HOY.md)** — configuración de Jam, creación de los
   5 agentes y la sala. Empieza aquí.
2. **[banda/00-diseno-banda.md](banda/00-diseno-banda.md)** — quién es cada agente,
   qué skill usa, y el grafo de `@mention`. Léelo antes de crear los agentes.
3. **[banda/01-briefs.md](banda/01-briefs.md)** — los textos exactos para pegar.
4. **[plantillas/](plantillas/)** — `plan.md` y `architecture.json` para publicar en la sala.
5. **[ensayo/ensayo-general.md](ensayo/ensayo-general.md)** — la prueba de humo.
   Si esto pasa, la fábrica funciona.

## Referencia

- **[referencia/jam-cheatsheet.md](referencia/jam-cheatsheet.md)** — comandos y trampas.
- **[referencia/reglas-hackathon.md](referencia/reglas-hackathon.md)** — qué hay que
  entregar y cómo se puntúa.

## Pista elegida: 💰 Bolsillo lleno (clon de Venmo)

**Razón:** el invariante es una ley de conservación —la suma de todos los saldos
no cambia nunca— y eso se comprueba con una sola aserción después de cualquier
tormenta de concurrencia. Además evita las zonas horarias, que en la pista de
mesa permean las cuatro etapas y son la familia clásica de bugs que pasan en local
y fallan en el entorno del corrector. El redondeo, en cambio, se resuelve con una
decisión tomada el minuto uno: enteros en unidades mínimas.

Los invariantes y las decisiones técnicas están en [plan.md](plan.md) y grabados
en los tres roles.

### ⚠️ La condición que revierte esta decisión

Si el Discord de BAND dice que **Bolsillo está concurrida y Mesa vacía, cámbiate**.
La estructura de premios pesa más que el ajuste de dominio: basta **1 inscripción
válida** para que se otorgue el primer puesto (4 para el segundo, 6 para el
tercero), y los premios no otorgados **no se redistribuyen**.

La elección de arriba es la correcta *a igualdad de concurrencia*. Los datos la
anulan.

## Fechas

| Hito | Cuándo |
|---|---|
| Preparación (esto) | hasta el 25 sep |
| Inicio del build | 26 sep, 09:00 PDT |
| Cierre | 5 oct, 23:59 PDT |

⚠️ Convierte ambas a tu zona horaria y ponlas en el calendario. El cierre en PDT
puede caer de madrugada del día siguiente donde estés.
