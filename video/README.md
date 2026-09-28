# El vídeo

Los rótulos están montados. Falta el metraje de la sala, que solo puedes grabar
tú desde Band Desktop.

**Total: 2:55.** 85 s de rótulos (hechos) + 90 s de sala (por grabar).

## Qué hay aquí

| Carpeta | Qué |
|---|---|
| `cards/` | El HTML de cada rótulo. Se edita y se vuelve a renderizar |
| `png/` | Los rótulos a 1920×1080 |
| `clips/` | **Los ocho rótulos ya en MP4**, con la duración exacta y fundidos |
| `narracion.srt` | Guion de voz en off y subtítulos, con los tiempos cuadrados |

## La línea de tiempo

| Desde | Hasta | Qué va | Estado |
|---|---|---|---|
| 0:00 | 0:12 | `clips/01-hook.mp4` | ✅ |
| 0:12 | 0:30 | `clips/02-claim.mp4` | ✅ |
| 0:30 | 0:38 | **Toma A** — lista de participantes de la sala | ⬜ 8 s |
| 0:38 | 0:50 | **Toma B** — el mensaje de arranque, **4:06 p.m.** | ⬜ 12 s |
| 0:50 | 1:08 | **Toma C** — la checklist de 158 ítems, **4:29 p.m.** | ⬜ 18 s |
| 1:08 | 1:33 | **Toma D** — el rechazo: **4:12 → 4:29 p.m.** | ⬜ 25 s |
| 1:33 | 1:48 | **Toma E** — `@mention` y respuesta, **4:33 → 4:34 p.m.** | ⬜ 15 s |
| 1:48 | 2:00 | **Toma F** — el tablero de 17 tareas | ⬜ 12 s |

Las horas son las de Jam. La sala es **`dark-factory`**, no ninguna de las
`New Session`: esas son el run limpio abortado y el banco de pruebas del motor.
| 2:00 | 2:07 | `clips/03-proof-tests.mp4` | ✅ |
| 2:07 | 2:14 | `clips/04-proof-float.mp4` | ✅ |
| 2:14 | 2:22 | `clips/05-proof-cost.mp4` | ✅ |
| 2:22 | 2:36 | `clips/06-honesty.mp4` | ✅ |
| 2:36 | 2:48 | `clips/07-deletetest.mp4` | ✅ |
| 2:48 | 2:55 | `clips/08-closing.mp4` | ✅ |

**Las tomas G y H son opcionales.** Si quieres la suite y `money.go` en pantalla,
ponlos de fondo bajo los rótulos 03 y 04 en Clipchamp, con el texto del rótulo
encima. El vídeo funciona sin ellos: los rótulos se sostienen solos.

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
