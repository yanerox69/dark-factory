# Seat Reservation Service — Specification

**Status:** authoritative. Grading is literal against this document. Where "good
taste" and this spec disagree, this spec wins.

**Version:** 1.0

---

## 1. Purpose

A small HTTP service that reserves seats. A seat may be reserved by at most one
request, ever. Reservations are idempotent per `idempotency_key`. The service
must never crash (HTTP 500) on client-supplied malformed input.

---

## 2. Technical decision (architect's call)

- **Runtime:** Node.js (LTS ≥ 18). No external/runtime npm dependencies.
- **HTTP:** Node built-in `node:http`.
- **Tests:** Node built-in `node:test` + `node:assert`.
- **Storage:** in-process, in-memory. State does not survive a restart. This is
  acceptable for the dry run; persistence is explicitly out of scope.
- **Concurrency model:** Node runs request handlers on a single-threaded event
  loop. Correctness must not rely on that accident alone — the reserve operation
  MUST be expressed as one **atomic critical section** (read-decide-write with no
  `await` interleaving inside it), so the design stays correct if the body is
  ever parsed asynchronously. See §7.

Rationale: zero dependencies makes the regression gate deterministic and fast on
any host with Node installed, and removes install/lockfile drift as a failure
mode during the hackathon.

---

## 3. Data model

### Seat
```
{ "seat_id": "A1", "state": "available" | "reserved" }
```

- Seats are pre-seeded at process start. The seed set is fixed and known:
  `A1, A2, A3, B1, B2, B3` (6 seats), all initially `available`.
- `seat_id` is a non-empty string. Valid seat ids are exactly the seeded set.
- A seat has exactly two states: `available`, `reserved`. There is no
  "unreserve" / release operation in v1.

### Reservation record (internal)
Keyed by `idempotency_key`. Stores the exact response body + status code that
was first returned for that key, plus the `seat_id` it acted on.

---

## 4. Endpoints

### 4.1 `GET /seats`

Lists all seats and their current state.

- **200 OK**
```json
{
  "seats": [
    { "seat_id": "A1", "state": "available" },
    { "seat_id": "A2", "state": "reserved" }
  ]
}
```
- Order MUST be stable and deterministic: ascending by `seat_id`.
- No query parameters are read. Unknown query params are ignored.

### 4.2 `POST /reserve`

Reserves one seat.

**Request headers:** `Content-Type: application/json` expected. A body that does
not parse as JSON is malformed (see §6).

**Request body:**
```json
{ "seat_id": "A1", "idempotency_key": "client-generated-uuid-or-string" }
```

Field rules:
- `seat_id`: required, string, non-empty, must be one of the seeded seat ids.
- `idempotency_key`: required, string, non-empty, length ≤ 200 chars.
- Both fields must be present. Extra unknown fields are ignored (not an error).

**Success — 201 Created** (first successful reservation for this key):
```json
{
  "status": "reserved",
  "seat_id": "A1",
  "idempotency_key": "abc-123"
}
```

**Idempotent replay:** A repeat request with a previously-seen
`idempotency_key` returns the **byte-identical body and the identical status
code** that was first produced for that key, WITHOUT performing the reservation
work again. This holds whether the first response was a success or a
deterministic client error that was recorded (see §5.4 for exactly which
outcomes are recorded).

---

## 5. Documented error codes

All error responses share this envelope and are always valid JSON:
```json
{ "error": { "code": "<STABLE_CODE>", "message": "<human readable>" } }
```

`code` is a stable machine-readable string. Clients key on `code`, not on
`message` or on HTTP status alone. **`message` is free-form human-readable text
and is NOT part of the contract** — only `error.code` and the HTTP status are
asserted by conformance/gate tests. The full set:

| HTTP | `error.code`            | When                                                                 |
|------|-------------------------|----------------------------------------------------------------------|
| 400  | `INVALID_JSON`          | Body is not parseable JSON, or is not a JSON object.                 |
| 400  | `MISSING_FIELD`         | `seat_id` or `idempotency_key` absent/null.                          |
| 400  | `INVALID_FIELD`         | Field present but wrong type, empty, or `idempotency_key` too long.  |
| 404  | `SEAT_NOT_FOUND`        | `seat_id` is well-formed but not a seeded seat.                      |
| 409  | `SEAT_TAKEN`            | Seat already `reserved` (by a *different* idempotency_key).          |
| 405  | `METHOD_NOT_ALLOWED`    | Known path, wrong HTTP method (e.g. `GET /reserve`, `POST /seats`).  |
| 404  | `NOT_FOUND`             | Unknown path.                                                        |
| 413  | `PAYLOAD_TOO_LARGE`     | Request body exceeds 64 KiB (hard cap, guards memory).               |
| 415  | `UNSUPPORTED_MEDIA_TYPE`| `POST /reserve` with a non-JSON or **missing** `Content-Type` when a body is sent. |

Validation precedence for `POST /reserve` (checked in this order; first failure
wins, so tests are deterministic):
1. Body size ≤ 64 KiB else `413 PAYLOAD_TOO_LARGE`.
2. `Content-Type` is present and is JSON (`application/json`, optionally with a
   charset param) else `415 UNSUPPORTED_MEDIA_TYPE`. **A missing/absent
   `Content-Type` on a request carrying a body is treated as non-JSON → 415**
   (ruling A3: strict, for determinism).
3. Body parses as JSON **object** else `400 INVALID_JSON`.
4. Required fields present else `400 MISSING_FIELD`.
5. Field types/values valid else `400 INVALID_FIELD`.
5.5. **Idempotency lookup** — reached only once the request is well-formed
   (steps 1–5 passed). If `idempotency_key` was seen before:
   - bound to the **same** `seat_id` → replay its stored response **verbatim**
     (same status, byte-identical body); do no reservation work.
   - bound to a **different** `seat_id` → `409 IDEMPOTENCY_KEY_REUSED`.
   If the key is unseen, continue to step 6.
   (Ruling A2: replay/reuse sits after shape validation and before seat
   existence/availability. This is why SEAT_NOT_FOUND / SEAT_TAKEN for a *new*
   key are computed at steps 6–7, and only 201 and 409 SEAT_TAKEN are recorded
   per §5.4.)
6. Seat exists else `404 SEAT_NOT_FOUND`.
7. Seat available else `409 SEAT_TAKEN`.
8. Otherwise reserve → `201`.

### 5.4 Which outcomes are recorded under the idempotency key

- A **`201` success** is recorded and replayed.
- A **`409 SEAT_TAKEN`** is recorded and replayed (the key deterministically
  maps to "the seat you asked for was taken").
- `4xx` request-shape errors (`INVALID_JSON`, `MISSING_FIELD`, `INVALID_FIELD`,
  `SEAT_NOT_FOUND`, size/media errors) are **NOT** recorded — they never bind a
  key, because a malformed request has no well-defined key semantics. A client
  that fixes its request and retries with the same key still gets a real attempt.

**Conflict rule:** If the same `idempotency_key` is reused with a *different*
`seat_id` than the one it originally reserved, return
`409 IDEMPOTENCY_KEY_REUSED` (add to table as HTTP 409). Rationale: a key
identifies one logical operation; changing its target is a client bug and must
not silently reserve a second seat.

| 409  | `IDEMPOTENCY_KEY_REUSED` | Key seen before but with a different `seat_id`. |

---

## 6. Malformed input — never a 500

Any client-controlled input that is malformed MUST resolve to one of the §5
documented 4xx codes, never a 500 and never a dropped/hung connection.
Explicitly covered:
- Empty body, whitespace body, truncated JSON, JSON array/string/number at top
  level (not an object), duplicate keys, deeply nested JSON, non-UTF-8 bytes.
- Wrong types (`seat_id: 123`, `idempotency_key: {}`), null fields, empty
  strings, oversized `idempotency_key`.
- Missing `Content-Type`, wrong `Content-Type`.

A genuine server-side bug surfacing as 500 is a spec violation. The handler
top-level MUST catch unexpected errors and, if one occurs, return
`500 { "error": { "code": "INTERNAL", ... } }` — but reaching this path on any
documented malformed input listed above is a FAILURE, not an accepted outcome.

---

## 7. Concurrency requirement (no double-booking)

Invariant: **at most one `201` is ever produced for a given `seat_id`.** If N
concurrent `POST /reserve` requests target the same available seat with N
distinct idempotency keys, exactly **one** returns `201 reserved` and the other
N−1 return `409 SEAT_TAKEN`. The seat ends `reserved` exactly once.

Design constraint: the check-and-set (steps §5 6→8) MUST be a single atomic
critical section over shared state with no asynchronous suspension point
(`await`, I/O, timer) between the "is it available?" read and the "mark
reserved" write. Reading the full body must complete *before* entering the
critical section.

Idempotency under concurrency: N concurrent requests with the **same**
idempotency_key and same seat must yield exactly one reservation and N identical
responses; they must not produce two `201`s nor a `201`+`409` split.

**Evidence (ruling A4):** the concurrency invariant is proven **behaviorally**
by the gate's ≥100-concurrent-request tests (§10.2) — that test is the *binding*
evidence and MUST pass. The structural "no `await`/suspension inside the
read-decide-write critical section" check is a *supporting* assertion (code
inspection / a static grep in the store module); it is required but does not by
itself substitute for the behavioral test.

---

## 8. Operational

- Server listens on `127.0.0.1:PORT`. `PORT` from env `PORT`, default `3000`.
- Startup MUST be exposed as a factory (e.g. `createServer()` returning a
  `http.Server`) so tests can start it on an ephemeral port (`:0`) without a
  fixed port. A `start()` that reads `PORT` and listens is also provided for
  manual runs.
- Responses always set `Content-Type: application/json; charset=utf-8`.
- No logging to stdout is required; if present it must not break test parsing.

---

## 9. Deliverables & repository layout (under `dry-run/`)

```
dry-run/
  SPEC.md              (this file)
  CONFORMANCE.md       (checklist — produced by spec-warden)
  package.json         (scripts: start, test; type=module or commonjs — builder's call)
  src/
    server.js          (createServer factory + store + handlers)
    store.js           (in-memory seat + idempotency store, atomic reserve)
  test/
    *.test.js          (node:test)
  README.md            (how to run + curl examples)
```

---

## 10. The regression gate (definition of done)

The gate is the authoritative pass/fail. It MUST run start-to-finish (no
`| tail`, no `| grep` — a pipeline's exit code hides a red gate) and every step
must exit 0:

1. **Syntax/lint:** `node --check` on every `src/**.js` and `test/**.js`, and
   `npm run lint` if a linter is configured (0 external deps preferred; a
   `node --check` sweep is the minimum).
2. **Tests:** `npm test` (`node --test`) — all pass, including:
   - GET /seats shape + ordering.
   - Each documented error code in §5 reproduced by a request.
   - Malformed-input battery from §6 — asserts status is the documented 4xx and
     **never 500**.
   - Idempotent replay: same key → byte-identical body + status, work done once
     (assert seat count of reserved seats does not increase on replay).
   - Idempotency-key-reuse conflict (§5.4) → `409 IDEMPOTENCY_KEY_REUSED`.
   - **Concurrency:** fire ≥100 concurrent reserves at one seat with distinct
     keys → exactly one `201`, rest `409 SEAT_TAKEN`, seat reserved once.
   - **Concurrency + idempotency:** ≥100 concurrent reserves, same key, same
     seat → exactly one reservation, all responses identical.
3. **Format check:** if a formatter is configured, `--check` mode exits 0. If
   none, this step is explicitly N/A and stated as such.

A green gate requires: build/syntax pass, ALL tests pass, and the concurrency +
malformed-input properties above demonstrated by tests, not by argument.

---

## 11. Out of scope (v1)

Auth, persistence, seat release/cancel, multi-seat reservation in one call,
pagination, rate limiting, TLS. Do not implement; do not let their absence block
sign-off.
