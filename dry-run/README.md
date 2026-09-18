# Seat Reservation Service (dry-run)

A tiny HTTP service that reserves seats. Zero runtime dependencies — Node built-in
`node:http`, tested with `node:test` + `node:assert`. Implements `dry-run/SPEC.md`
v1.0 to the `dry-run/CONFORMANCE.md` checklist.

## Requirements

- Node.js LTS ≥ 18.

## Run

```sh
cd dry-run
npm start            # listens on 127.0.0.1:$PORT (default 3000)
PORT=8080 npm start  # custom port
```

`createServer()` (in `src/server.js`) is exported as a factory returning an
`http.Server`, so tests bind an ephemeral port with `server.listen(0)`.

## Endpoints

### `GET /seats`

```sh
curl -s http://127.0.0.1:3000/seats
# {"seats":[{"seat_id":"A1","state":"available"}, ... ]}   # ascending by seat_id
```

### `POST /reserve`

```sh
curl -s -X POST http://127.0.0.1:3000/reserve \
  -H 'Content-Type: application/json' \
  -d '{"seat_id":"A1","idempotency_key":"abc-123"}'
# 201 {"status":"reserved","seat_id":"A1","idempotency_key":"abc-123"}

# Replay (same idempotency_key) -> byte-identical body + identical status, no new work.
# Same seat, different key, already reserved -> 409 {"error":{"code":"SEAT_TAKEN",...}}
# Same key, different seat_id            -> 409 {"error":{"code":"IDEMPOTENCY_KEY_REUSED",...}}
```

### Error envelope

```json
{ "error": { "code": "<STABLE_CODE>", "message": "<human readable>" } }
```

Documented codes / statuses (SPEC §5): `INVALID_JSON` 400, `MISSING_FIELD` 400,
`INVALID_FIELD` 400, `SEAT_NOT_FOUND` 404, `SEAT_TAKEN` 409, `METHOD_NOT_ALLOWED`
405, `NOT_FOUND` 404, `PAYLOAD_TOO_LARGE` 413, `UNSUPPORTED_MEDIA_TYPE` 415,
`IDEMPOTENCY_KEY_REUSED` 409. Client keys on `code`, not on `message` (free-form).

## Design notes (graded invariants)

- **First-failure-wins precedence** (SPEC §5 steps 1–8): size → media type →
  JSON-object → required fields → types/values → seat exists → seat available →
  reserve.
- **Atomic reserve** (SPEC §7): the check-and-set lives in `src/store.js`
  `reserve()` — a single synchronous critical section with no `await`/I/O/timer
  between the availability read and the reserved write. The full request body is
  read in `src/server.js` **before** `store.reserve()` is called.
- **Idempotency** (SPEC §4.2, §5.4): `201` successes and `409 SEAT_TAKEN` are
  recorded and replayed byte-identically; request-shape / size / media 4xx are
  **not** recorded (a fixed retry with the same key gets a real attempt).
- **Never 500 on malformed input** (SPEC §6): every documented malformed input
  resolves to a documented 4xx. A top-level catch maps any unexpected throw to
  `500 INTERNAL`, but no documented malformed input reaches it.

## The regression gate (definition of done, SPEC §10)

**One command, start-to-finish, no pipes:**

```sh
cd dry-run
npm run gate        # == node gate.js
```

`gate.js` (zero dependencies) runs all three steps in order and exits **0 only if
every step exits 0**. Each step is spawned with inherited stdio — there are **no
shell pipes**, so a step's real exit code is never masked by a pipeline's last
command (the classic `... | tail` trap that lets a red gate read as exit 0). The
first failing step is named and the gate exits non-zero.

1. **Syntax ([C-73]):** `node --check` over every `*.js` under `src/**` and
   `test/**`.
2. **Tests ([C-74]):** `node --test` — the full suite (83 tests incl.
   `test/race-hunter.test.js`), start-to-finish.
3. **Format ([C-75]):** **N/A** — zero runtime dependencies, no formatter/linter
   configured (SPEC §2), stated explicitly by the gate.

The individual steps can still be run standalone if needed:

```sh
node --check src/server.js && node --check src/store.js && node --check test/*.test.js
npm test
```

## Resolved rulings (A1–A4) — FINAL, folded into SPEC.md and implemented

These four questions were ruled by the architect, folded into `SPEC.md`, and are
implemented in this codebase with matching tests ([C-16]..[C-25], [C-34a]..[C-34e],
[C-59], [C-63]..[C-67]). None is open.

- **A1** — `error.message` text is free-form; only `code` + HTTP status are the
  literal contract.
- **A2** — the `idempotency_key` lookup is **step 5.5**: after request-shape
  validation (steps 1–5) and before seat existence/availability (steps 6–7). Seen
  key + same seat → verbatim replay; seen key + different seat →
  `IDEMPOTENCY_KEY_REUSED`; unseen → continue. Only `201` and `409 SEAT_TAKEN`
  are recorded.
- **A3** — a **missing** `Content-Type` with a non-empty body is treated as
  non-JSON → `415 UNSUPPORTED_MEDIA_TYPE` (strict), same as a wrong
  `Content-Type`.
- **A4** — the ≥100-concurrent behavioral tests are binding evidence; the no-await
  read-decide-write structural check on `src/store.js reserve()` is required but
  supporting.

## Out of scope (SPEC §11)

No auth, persistence, seat release/cancel, multi-seat reservation, pagination,
rate limiting, or TLS. State is in-memory and does not survive a restart.
