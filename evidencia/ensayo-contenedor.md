# Contenedor limpio — ensayo (`dry-run/`)

Fecha: 23 de septiembre de 2026 · Docker 29.6.2

Rehearsal of the requirement that decides zero points:

> *"It must build and serve from a clean container with no outbound network.
> A service that doesn't start scores zero."*

Este es el servicio del ensayo, no un entregable. Se prueba aquí para validar el
patrón antes de replicarlo en cada `stage-N/`.

---

## ✅ Resultado: pasa

```
docker build -t darkfactory-dryrun .          → ok
docker run -d --network none darkfactory-dryrun → Up
```

### Lectura

```
GET /seats  → 200
{"seats":[{"seat_id":"A1","state":"available"},{"seat_id":"A2","state":"available"},
 {"seat_id":"A3","state":"available"},{"seat_id":"B1","state":"available"},
 {"seat_id":"B2","state":"available"},{"seat_id":"B3","state":"available"}]}
```

Seis asientos, todos disponibles en arranque limpio, tal como fija la spec.

### Escritura, replay y error documentado

```
reserve #1      201  {"status":"reserved","seat_id":"A1","idempotency_key":"k1"}
replay same k   201  {"status":"reserved","seat_id":"A1","idempotency_key":"k1"}
identical       true
other key/seat  409  {"error":{"code":"SEAT_TAKEN","message":"Seat is already reserved."}}
```

Tres cosas quedan demostradas **dentro del contenedor y sin red**:

1. La ruta de escritura funciona
2. El replay con la misma clave devuelve la respuesta original **byte a byte**
3. Un asiento ya reservado da el **error documentado**, no un 500

---

## 🚨 El hallazgo que importa para el build

**Con el puerto publicado, el servicio es inalcanzable desde el host.**

```
docker run -d -p 3999:3000 darkfactory-dryrun
GET http://localhost:3999/seats  →  NO ALCANZABLE
                                    "La conexión ha terminado de forma inesperada"
```

Causa: `src/server.js` hace `server.listen(port, '127.0.0.1')`. Dentro de un
contenedor, esa dirección **solo existe para el propio contenedor**. Publicar el
puerto no sirve de nada y, desde fuera, el servicio parece muerto.

En el ensayo es correcto —su spec lo exigía— pero **en las etapas de competición
sería puntuación cero**: el corrector vería un servicio que no arranca.

### La corrección para cada `stage-N/`

```js
const host = process.env.HOST || '127.0.0.1';
server.listen(port, host);
```

Las pruebas locales siguen cumpliendo una spec que pida loopback, y el contenedor
arranca con `HOST=0.0.0.0`. **Esto va en el brief del `architect` el día 1.**

---

## Cómo reproducirlo

```powershell
cd stage-N
docker build -t darkfactory-stageN .
docker run -d --network none --name probe darkfactory-stageN
docker exec probe wget -qO- http://127.0.0.1:3000/<ruta de lectura>
docker rm -f probe
```

⚠️ Para probar rutas de escritura **no uses `wget --post-data` desde PowerShell**:
el entrecomillado atraviesa PowerShell, `docker exec` y `sh`, y el JSON llega
malformado. El servicio responde 400 y parece un fallo suyo cuando no lo es.
Copia una sonda con `docker cp` y ejecútala con `node` dentro del contenedor.
