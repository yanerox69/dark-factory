# Reglas y entregables — Dark Factory

## Fechas

| Hito | Cuándo |
|---|---|
| WeAreDevelopers World Congress NA (San José) | 23–25 sep 2026 |
| **Inicio del build** | **26 sep 2026, 09:00 PDT** |
| **Cierre** | **5 oct 2026, 23:59 PDT** |
| Envío manual de emergencia | hasta 6 h después, solo con aprobación previa |

⚠️ Convierte a tu zona horaria. El cierre en PDT puede caer de madrugada.

## Premios

**$6.000 en efectivo**, repartidos entre dos pistas. Solo compites contra equipos
de tu pista.

| Puesto | Encargado de mesa | Bolsillo lleno |
|---|---|---|
| 1º | $1.500 | $1.500 |
| 2º | $1.000 | $1.000 |
| 3º | $500 | $500 |

**Regla estratégica clave:** un puesto solo se otorga si la pista tiene
suficientes inscripciones válidas — **1 para el primero**, 4 para el segundo, 6
para el tercero. Los premios no otorgados **no se redistribuyen**.

Extra: **$300 en créditos Featherless** por equipo ganador (se anunciará a qué
pista aplica).

## Las dos pistas

Ambas son clones "white room" de un producto conocido. Elige una y mantente en ella.

### 🍽️ Encargado de mesa (OpenTable)
Sistema de reservas de restaurantes.
**La parte difícil:** una mesa nunca debe reservarse dos veces, teniendo en cuenta
concurrencia, reintentos y zonas horarias.

### 💰 Bolsillo lleno (Venmo)
Aplicación de billetera y pagos.
**La parte difícil:** el dinero nunca debe crearse, destruirse ni gastarse dos
veces, en transferencias simultáneas, reintentos y redondeo.

## Las cuatro etapas

Se publica una especificación escrita al inicio. Ambas pistas siguen las mismas
cuatro etapas, cada una con su propia especificación.

1. **API JSON** — cada endpoint especificado, con formatos de respuesta y códigos
   de error documentados.
2. **Interfaz de usuario web** — las pantallas que consumen la API de la etapa 1,
   con el atributo `data-testid` **exacto** que indica el nombre de cada elemento.
3. **Control de concurrencia** — en cada ruta de escritura: check-and-act atómico,
   claves de idempotencia que devuelven la respuesta original, entrada malformada
   con el error documentado en lugar de un 500.
4. **Extensión de dominio** — una extensión real del mismo dominio, ampliando el
   modelo y la API ya construidos, sin romper nada de lo que ya funciona.

> **Señal crítica:** `data-testid` exacto + "códigos de error documentados" + "el
> error documentado en lugar de un 500" significa **evaluación automatizada por
> conformidad**. No se gana con una demo bonita, se gana con conformidad literal.

## Qué se entrega

Del propio hackathon — **tres cosas, no una**:

- [ ] **La fábrica** (la banda de agentes y la sala de BAND donde trabaja)
- [ ] **La ejecución / traza** que produjo el resultado
- [ ] **El resultado** (la app funcionando)

Del reglamento general de lablab.ai:

- [ ] Título claro y descriptivo
- [ ] Descripción corta y larga (respetar límites — son críticas para evaluar)
- [ ] Tags de tecnología y categoría
- [ ] Imagen de portada PNG/JPG en **16:9**
- [ ] **Vídeo MP4, menos de 5 min, máx. 300 MB**
- [ ] **Slides en PDF** (obligatorio)
- [ ] **Repositorio GitHub público**
- [ ] **Demo desplegada** en Streamlit, Replit o Vercel + URL funcional
- [ ] **Licencia MIT** y trabajo original

De la guía de hackers de BAND, explica en el vídeo/slides:

- [ ] **La banda** — cada agente, framework, modelo y su rol
- [ ] **Quién habla con quién** — decisiones de enrutamiento por `@mention`
- [ ] **Un flujo típico de punta a punta** — desde el inicio hasta la decisión humana
- [ ] **El delete test** — qué se rompe si quitas BAND del diseño

Si ganas, se publica como caso de estudio: **la tarea, la banda, la decisión clave
de diseño, el resultado verificado, el coste y la limitación**. Registra coste y
limitaciones desde el día 1 — te los van a pedir.

## Cómo se puntúa

1. Presentación
2. Valor de negocio
3. Aplicación de la tecnología
4. Originalidad

## Descalificación

Plagio o manipular el sistema de votación = descalificación inmediata. También
hacer trampas, manipular sistemas, usar automatización no autorizada o conducta
fraudulenta.

## Patrocinadores y recursos

| | |
|---|---|
| **BAND** | https://band.ai · [Guía para hackers](https://www.band.ai/hacker-guide) · [Docs](https://docs.band.ai) · [Discord](https://discord.com/invite/5YkNXmYfjk) |
| **Docker Sandboxes** | Entornos aislados reproducibles. En Jam: `Settings → Experiments → Docker Sandboxes` (apagado por defecto) |
| **Featherless AI** | Inferencia serverless, API compatible con OpenAI, +30.000 modelos abiertos. **$25 en créditos**, hasta 1000 participantes por orden de llegada. Código por email poco antes del inicio. ⚠️ **Pide tarjeta**: cancela antes del siguiente ciclo si no lo sigues usando |

⚠️ **No confundir**: `band.us` es una red social coreana sin relación. El del
hackathon es `band.ai`. Y el correo de **Fireworks AI** que recibiste **no** tiene
que ver con este hackathon — el patrocinador de inferencia es Featherless.
