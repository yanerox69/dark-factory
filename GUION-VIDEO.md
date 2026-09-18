# Guion del vídeo

**Límite duro: menos de 5 minutos, máximo 300 MB, MP4.** Esta escaleta ocupa
**4:20**, dejando margen.

Se graba narrando sobre el deck, cortando a capturas reales en los tramos
marcados. El deck está en el enlace del artefacto de esta sesión.

---

## Antes de grabar: capturas que necesitas

Grábalas **mientras la fábrica trabaja**, no después. Son las que dan credibilidad.

| # | Qué capturar | Dónde | Duración |
|---|---|---|---|
| A | Las swim lanes moviéndose, con tareas cambiando de estado | Jam → Work → By agent | 20 s |
| B | La sala con los mensajes entre agentes y una mención visible | Jam → Chat | 15 s |
| C | El diagrama Arch, pulsando un nodo para filtrar el tablero | Jam → plan rail | 10 s |
| D | La suite pasando en terminal, con el recuento final | PowerShell, `npm test` | 15 s |
| E | La app desplegada haciendo una transferencia | El navegador, sobre Vercel | 20 s |

⚠️ Antes de grabar cualquier terminal: comprueba que no hay claves a la vista.

---

## Escaleta

### 0:00 – 0:25 · Apertura
**En pantalla:** diapositiva `cover`

> "Este hackathon se corrige de forma automática y literal. Nombres de campo
> exactos, códigos de estado exactos, atributos `data-testid` exactos. Una
> pantalla preciosa con un atributo mal escrito puntúa cero.
>
> Así que la ventaja competitiva no es implementar más rápido. Es negarse a
> entregar algo que no cumpla. Y eso decidió todo el diseño."

---

### 0:25 – 0:50 · El reto
**En pantalla:** diapositiva `brief`

> "Cuatro etapas graduadas contra una especificación que se publica al arrancar:
> la API, la interfaz, el control de concurrencia, y una extensión del dominio
> que no puede romper nada de lo anterior."

---

### 0:50 – 1:25 · La banda
**En pantalla:** diapositiva `crew`

> "Cinco agentes en una sala compartida. Y fíjate en la última columna: **cuatro
> de los cinco tienen prohibido escribir código de producción**.
>
> Un implementador, un planificador, y tres verificadores. La proporción es
> deliberada: bajo corrección literal, rechazar vale más que producir."

---

### 1:25 – 2:05 · El enrutamiento ← **corta a captura B**
**En pantalla:** diapositiva `routing`, luego captura B

> "Añadir un agente a una sala no lo despierta. Hay que mencionarlo. Así que
> cada traspaso es una mención explícita, y eso *es* el cableado.
>
> Lo importante: los destinatarios no están cableados. Cada rol le dice al agente
> que **inspeccione la sala y mencione él mismo a quien corresponda**. La línea
> se puede recomponer en caliente, y un agente que detecta que falta experiencia
> puede reclutar a otro y delegarle.
>
> Y los rechazos van hacia atrás. Una sola desviación devuelve el trabajo entero."

---

### 2:05 – 2:35 · El flujo ← **corta a capturas A y C**
**En pantalla:** diapositiva `flow`, luego A, luego C

> "Un ciclo completo: el humano publica el brief mencionando al architect. Este
> escribe la especificación y delega. El verificador la convierte en una lista de
> conformidad numerada. El builder implementa citando ítems concretos. Las aduanas
> verifican contra el código que corre, no contra el informe.
>
> El humano vuelve a aparecer solo para una decisión de producto."

---

### 2:35 – 3:10 · La prueba ← **corta a captura D**
**En pantalla:** diapositiva `proof`, luego D

> "Antes de que abriera el hackathon, la banda construyó un servicio completo a
> partir de un brief de un párrafo. Ochenta y siete tests, ochenta y siete
> pasando.
>
> Y los ejecuté yo, a mano. Todo el diseño se apoya en no fiarse de los informes,
> así que aplicamos la misma regla a los propios agentes."

---

### 3:10 – 3:40 · Lo que no cableamos
**En pantalla:** diapositiva `emergent`

> "Tres cosas que no estaban en el brief.
>
> El cazador de concurrencia levantó una carrera, la refutó él mismo, y la retiró
> en público. El architect lo registró como *the honest ghost withdrawal*.
>
> Después **corrigió a su supervisor**: *el recuento es 87, no 83*. Tenía razón.
>
> Y el architect firmó el punto crítico de atomicidad citando fichero y línea, no
> el resumen del builder.
>
> Una tubería no puede retirar su propio hallazgo ni corregir a la etapa de arriba."

---

### 3:40 – 4:00 · El delete test
**En pantalla:** diapositiva `deletetest`

> "¿Qué pasa si quitas BAND? El rebote se queda sin canal. El reclutamiento en
> caliente se queda sin registro. El tablero, el plan versionado y las trazas —que
> son el resultado verificado que pide el reto— se quedan sin dónde vivir.
>
> Quitar BAND no degrada la fábrica. La elimina."

---

### 4:00 – 4:20 · La limitación y el cierre ← **corta a captura E**
**En pantalla:** diapositiva `limitation`, luego E, luego `closing`

> "Y una cosa que hay que decir: **esta fábrica no es completamente oscura**. Un
> agente no puede aprobar la petición de permiso de otro. Las excepciones
> genuinas necesitan a una persona. Decir lo contrario sería falso.
>
> El trabajo del humano queda en tres verbos: asignar, responder, leer el
> veredicto. La fábrica hace el resto — y rechaza su propio trabajo cuando no
> cumple."

---

## Notas de producción

**Ritmo.** El tramo 3:10–3:40 es el que gana el hackathon. No lo aceleres: son
tres hechos concretos y cada uno necesita respirar.

**Lo que NO hay que hacer.** Nada de explicar qué es un agente, ni qué es un LLM,
ni cómo se instala Jam. Los jueces lo saben. Cada segundo gastado en contexto
genérico es un segundo robado a la evidencia.

**Voz.** Afirmaciones, no condicionales. "La banda construyó" y no "la banda
podría construir". Todo lo que se cuenta aquí ocurrió de verdad y está en la sala.

**Subtítulos.** Ponlos. Muchos jueces ven sin sonido en la primera pasada.

**Los números.** Sustituye los del ensayo por los del build real antes de grabar,
tanto en el guion como en las diapositivas `proof` y `product`.
