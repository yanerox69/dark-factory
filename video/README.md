# El vídeo

✅ **Terminado.** `montaje.mp4` — **2:40, 11,3 MB**, muy por debajo de los
límites de 5 minutos y 300 MB.

85 s de rótulos generados + 75 s de la sala `dark-factory` grabada en Band
Desktop.

## Qué hay aquí

| Carpeta | Qué |
|---|---|
| `cards/` | El HTML de cada rótulo. Se edita y se vuelve a renderizar |
| `png/` | Los rótulos a 1920×1080 |
| `clips/` | **Los ocho rótulos ya en MP4**, con la duración exacta y fundidos |
| `narracion.srt` | Guion de voz en off y subtítulos, con los tiempos cuadrados |

## La línea de tiempo

En el orden en que los une `orden.txt`:

| Tramo | Qué es | Dura |
|---|---|---|
| `clips/01-hook.mp4` | *What if two thirds of your factory weren't allowed to write code?* | 12 s |
| `clips/02-claim.mp4` | *This is Dark Factory, built in BAND* | 18 s |
| `footage/B.mp4` | El brief de arranque, 4:06 p.m. | 12 s |
| `footage/C.mp4` | La checklist de 158 ítems, 4:29 p.m. | 13 s |
| `footage/D1.mp4` | Lo que el coordinator recomendó sobre A3, 4:12 p.m. | 10 s |
| `footage/D2.mp4` | **El rechazo del reviewer**, con C-152 y C-155 | 15 s |
| `footage/E.mp4` | El handoff, `@mention` en ambos sentidos, 4:33 → 4:34 p.m. | 13 s |
| `footage/F.mp4` | El barrido por los 451 mensajes | 12 s |
| `clips/03-proof-tests.mp4` | *147 tests. 147 passing* | 7 s |
| `clips/04-proof-float.mp4` | *No `float64` on the money path* | 7 s |
| `clips/05-proof-cost.mp4` | *3 h 49 m · 11,743,469 tokens · $11.70* | 8 s |
| `clips/06-honesty.mp4` | *We stopped the reviewer. It missed two defects.* | 14 s |
| `clips/07-deletetest.mp4` | *Take BAND out… it disappears* | 12 s |
| `clips/08-closing.mp4` | El repositorio | 7 s |

Las horas son las que muestra Jam, no las del `room.json`, que guarda UTC cuatro
horas por delante. La sala es **`dark-factory`**, no ninguna de las
`New Session`: esas son el run limpio abortado y el banco de pruebas del motor.

**La toma A se descartó.** El panel `Participants` con los tres asientos está
abierto en todos los planos, así que grabarla aparte era repetir lo que ya se ve.
**La toma F cambió**: el tablero no se puede grabar porque Jam solo lo renderiza
con una sesión de código enganchada, y engancharla habría añadido actividad nueva
a la sala juzgada. En su lugar va un barrido por los 451 mensajes, que dice lo
mismo y está disponible.

### Qué se versiona y qué no

`cards/`, `png/`, `clips/`, `narracion.srt` y este README sí. `footage/`,
`frames/`, `orden.txt` y `montaje.mp4` no: son material en bruto e intermedio, y
el vídeo final se entrega por lablab, no por el repositorio.

## Montaje con ffmpeg

### 1. Normaliza cada toma

El concat demuxer exige que todo tenga el mismo formato. Recorta y normaliza
cada grabación de una vez:

```bash
ffmpeg -y -ss 00:01:12 -to 00:01:20 -i "C:/Users/Yanero/Videos/Captures/sala.mp4" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p" -an -c:v libx264 -crf 20 -preset medium video/footage/A.mp4
```

`-ss` y `-to` son el tramo que quieres del fichero grande. `-an` quita el audio
porque la narración va aparte.

Repite para `B.mp4`, `C.mp4`, `D.mp4`, `E.mp4`, `F.mp4` con sus duraciones de la
tabla.

### 2. Acelera lo que sea puro scroll

Las tomas C y F suelen ser scroll lento. A 2× se leen igual y ganas ritmo:

```bash
ffmpeg -y -i video/footage/C.mp4 -filter:v "setpts=0.5*PTS" -an video/footage/C-fast.mp4
```

**Nunca aceleres la toma D.** Es el plano que gana y hay que poder leerlo.

### 3. Une todo

Crea `video/orden.txt` con este contenido exacto:

```
file 'clips/01-hook.mp4'
file 'clips/02-claim.mp4'
file 'footage/A.mp4'
file 'footage/B.mp4'
file 'footage/C.mp4'
file 'footage/D.mp4'
file 'footage/E.mp4'
file 'footage/F.mp4'
file 'clips/03-proof-tests.mp4'
file 'clips/04-proof-float.mp4'
file 'clips/05-proof-cost.mp4'
file 'clips/06-honesty.mp4'
file 'clips/07-deletetest.mp4'
file 'clips/08-closing.mp4'
```

Y únelo:

```bash
ffmpeg -y -f concat -safe 0 -i video/orden.txt -c:v libx264 -crf 21 -preset slow -pix_fmt yuv420p -movflags +faststart video/montaje.mp4
```

### 4. Añade la voz

Graba la narración de `narracion.srt` en un solo `voz.wav` y pégala:

```bash
ffmpeg -y -i video/montaje.mp4 -i video/voz.wav -c:v copy -c:a aac -b:a 128k -shortest video/final.mp4
```

Sin voz en off, salta este paso: `montaje.mp4` ya es entregable.

### 5. Comprueba antes de subir

```bash
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 video/final.mp4
```

`duration` por debajo de **300**, `size` por debajo de **314572800**. A CRF 21 y
tres minutos deberías quedarte cerca de 120 MB.

## Regenerar un rótulo

Edita su HTML en `cards/`, y luego:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1920,1080 --virtual-time-budget=10000 --screenshot="video\png\01-hook.png" "file:///C:/Users/Yanero/Desktop/dark-factory/video/cards/01-hook.html?v=2"
```

⚠️ **El `?v=2` del final no es decorativo.** Chrome cachea la página `file://` y
sin él te reescribe el PNG anterior con fecha nueva — parece regenerado y no lo
está. Cambia el número cada vez.

Luego vuelve a hacer el clip, ajustando `-t` a su duración de la tabla:

```bash
ffmpeg -y -loop 1 -i video/png/01-hook.png -t 12 -r 30 -vf "fade=t=in:st=0:d=0.5,fade=t=out:st=11.4:d=0.6,format=yuv420p" -c:v libx264 -crf 20 -preset medium video/clips/01-hook.mp4
```
