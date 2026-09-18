# CONFORMANCE.md — Seat Reservation Service

**Produced by:** spec-warden
**Authoritative source:** `dry-run/SPEC.md` v1.0 (incl. architect rulings A1–A4:
free-form `message`, precedence step 5.5, strict missing-`Content-Type`→415,
behavioral-binding concurrency). This checklist is synced to that updated spec.
**Contract:** literal. Each item below is a single spec-verifiable unit tied to a
SPEC section and phrased to map 1:1 to a test the regression gate can run. Verdict
per item is **CONFORMS** (with `file:line` or observed response) or **DEVIATES**
(expected vs actual, side by side). **One deviation rejects the whole handoff.**

Field names, codes, and status numbers below are quoted verbatim from SPEC. Do not
paraphrase them in code. `error_code` is not `errorCode`; `seat_id` is not `seatId`.

Legend for the builder: every `[C-nn]` is one assertion (or one tight cluster of
assertions on the same response). Ambiguities are flagged **[AMBIGUITY]** and routed
to the architect — do not silently resolve them.

---

## A. GET /seats — shape & ordering (SPEC §4.1)

- **[C-01]** `GET /seats` returns HTTP **200**. *(§4.1)*
- **[C-02]** Response `Content-Type` header is exactly `application/json; charset=utf-8`. *(§8)*
- **[C-03]** Response body is a JSON object with a single top-level key `seats` whose value is an array. *(§4.1)*
- **[C-04]** Each element of `seats` is an object with exactly the keys `seat_id` and `state` (verbatim names). *(§4.1, §3)*
- **[C-05]** `seat_id` values are strings; `state` values are one of the string literals `"available"` or `"reserved"` — no other value. *(§3)*
- **[C-06]** On a fresh server, `seats` contains exactly the 6 seeded ids `A1, A2, A3, B1, B2, B3`, all with `state: "available"`. *(§3)*
- **[C-07]** `seats` is ordered strictly ascending by `seat_id` and this order is deterministic across repeated calls. Assert the returned id sequence equals `["A1","A2","A3","B1","B2","B3"]`. *(§4.1 "ascending by `seat_id`")*
- **[C-08]** Unknown query parameters (e.g. `GET /seats?foo=bar`) are ignored and still return the same 200 shape. *(§4.1 "Unknown query params are ignored")*
- **[C-09]** After a successful reservation of a seat, `GET /seats` shows that seat with `state: "reserved"` and all others unchanged. *(§4.1 example, §3)*

---

## B. POST /reserve — happy path 201 (SPEC §4.2)

- **[C-10]** `POST /reserve` with `Content-Type: application/json` and body `{"seat_id":"A1","idempotency_key":"abc-123"}` returns HTTP **201**. *(§4.2, §5 step 8)*
- **[C-11]** The 201 body is a JSON object with **exactly** these three keys and values (byte-for-byte field names):
  ```json
  { "status": "reserved", "seat_id": "A1", "idempotency_key": "abc-123" }
  ```
  Assert `status === "reserved"`, `seat_id` echoes the requested seat, `idempotency_key` echoes the requested key, and there are **no extra keys**. *(§4.2 success body)*
- **[C-12]** 201 response `Content-Type` is `application/json; charset=utf-8`. *(§8)*
- **[C-13]** Extra unknown fields in the request body (e.g. `{"seat_id":"A2","idempotency_key":"k","junk":1}`) are ignored and still yield **201** — not an error. *(§4.2 "Extra unknown fields are ignored")*

---

## C. Documented error codes — exact HTTP status + exact `error.code` (SPEC §5)

All error bodies MUST match the envelope exactly (verbatim keys):
```json
{ "error": { "code": "<STABLE_CODE>", "message": "<human readable>" } }
```
- **[C-14]** Every error response is valid JSON and has the shape `{"error":{"code":<string>,"message":<string>}}` — top-level key `error`, nested keys `code` and `message`, nothing else at the `error` level. *(§5)*
- **[C-15]** Every error response sets `Content-Type: application/json; charset=utf-8`. *(§8)*

One item per documented code. Each asserts the **exact HTTP status** and the **exact `error.code` string**:

- **[C-16]** `INVALID_JSON` → HTTP **400**. Trigger: body is not parseable JSON, or parses but is not a JSON object (array/string/number/`true`/`null` at top level). *(§5 table; §5 step 3)*
- **[C-17]** `MISSING_FIELD` → HTTP **400**. Trigger: `seat_id` or `idempotency_key` absent or `null`. *(§5 table; §5 step 4)*
- **[C-18]** `INVALID_FIELD` → HTTP **400**. Trigger: a required field present but wrong type, empty string, or `idempotency_key` longer than 200 chars. *(§5 table; §4.2 field rules; §5 step 5)*
- **[C-19]** `SEAT_NOT_FOUND` → HTTP **404**. Trigger: `seat_id` is a well-formed non-empty string but not one of the seeded ids. *(§5 table; §5 step 6)*
- **[C-20]** `SEAT_TAKEN` → HTTP **409**. Trigger: requested seat already `reserved` by a **different** idempotency_key. *(§5 table; §5 step 7)*
- **[C-21]** `METHOD_NOT_ALLOWED` → HTTP **405**. Trigger: known path with wrong method — assert both `GET /reserve` and `POST /seats`. *(§5 table)*
- **[C-22]** `NOT_FOUND` → HTTP **404**. Trigger: unknown path (e.g. `GET /nope`, `POST /reserve/extra`). *(§5 table)*
- **[C-23]** `PAYLOAD_TOO_LARGE` → HTTP **413**. Trigger: request body exceeds 64 KiB (65536 bytes) hard cap. *(§5 table; §5 step 1)*
- **[C-24]** `UNSUPPORTED_MEDIA_TYPE` → HTTP **415**. Trigger: `POST /reserve` with a body present and a non-JSON `Content-Type`. *(§5 table; §5 step 2)*
- **[C-25]** `IDEMPOTENCY_KEY_REUSED` → HTTP **409**. Trigger: an idempotency_key seen before (bound at step 5.5) but now sent with a **different** `seat_id` than it originally acted on. *(§5.4 conflict rule; §5 step 5.5; §5 appended table row)*

> **[A1 — RESOLVED by architect, folded into SPEC §5]** `error.message` is free-form
> human-readable text and is **NOT** part of the contract. Conformance/gate tests
> assert **only** `error.code` and the HTTP status — never `message` content. This is
> now the binding rule; items [C-16]..[C-25] assert code + status exclusively.

---

## D. Validation precedence — first-failure-wins (SPEC §5 steps 1–8)

Each item constructs a request that violates step *k* while **also** violating a
later step, and asserts the earlier code wins. This proves the ordering is real, not
incidental. Order (SPEC §5 as updated): 1 size → 2 media type → 3 JSON-object → 4
required → 5 types/values → **5.5 idempotency lookup** → 6 seat exists → 7 seat
available → 8 reserve.

- **[C-26]** **Step 1 beats 2:** body > 64 KiB **and** `Content-Type: text/plain` → **413 `PAYLOAD_TOO_LARGE`** (not 415). *(§5 step 1 before 2)*
- **[C-27]** **Step 2 beats 3:** body present, `Content-Type: text/plain`, body is non-JSON garbage → **415 `UNSUPPORTED_MEDIA_TYPE`** (not 400 INVALID_JSON). *(§5 step 2 before 3)*
- **[C-28]** **Step 3 beats 4:** `Content-Type: application/json`, body is `not json` (unparseable) → **400 `INVALID_JSON`** (not MISSING_FIELD). *(§5 step 3 before 4)*
- **[C-29]** **Step 3 (object check) beats 4:** valid JSON but top-level array/string/number, e.g. `[]` → **400 `INVALID_JSON`** (not MISSING_FIELD). *(§5 step 3 "JSON object"; §6)*
- **[C-30]** **Step 4 beats 5:** JSON object `{}` (both fields absent) → **400 `MISSING_FIELD`** (not INVALID_FIELD). *(§5 step 4 before 5)*
- **[C-31]** **Step 5 beats 6:** `seat_id` present but wrong type/empty, e.g. `{"seat_id":123,"idempotency_key":"k"}` or `{"seat_id":"","idempotency_key":"k"}` → **400 `INVALID_FIELD`** (not SEAT_NOT_FOUND). *(§5 step 5 before 6)*
- **[C-32]** **Step 6 beats 7:** well-formed unknown seat `{"seat_id":"Z9","idempotency_key":"k"}` → **404 `SEAT_NOT_FOUND`** (not SEAT_TAKEN, even if some seats are taken). *(§5 step 6 before 7)*
- **[C-33]** **Step 7 beats 8:** seat already reserved by a different key → **409 `SEAT_TAKEN`** (not a second 201). *(§5 step 7 before 8)*
- **[C-34]** **`idempotency_key` too long is INVALID_FIELD at step 5:** key length 201 chars with an otherwise-valid reservable seat → **400 `INVALID_FIELD`** (not 201). *(§4.2 "length ≤ 200"; §5 step 5)*

### D.5 Step 5.5 — idempotency lookup ordering (SPEC §5 step 5.5, A2 ruling)

Step 5.5 runs **only after** shape validation (steps 1–5) passes and **before** seat
existence/availability (steps 6–7). These items pin that placement:

- **[C-34a]** **Step 5 beats 5.5 (shape wins over a seen key):** first reserve A1 with key K1 (201). Then reuse K1 with a malformed shape, e.g. `{"seat_id":123,"idempotency_key":K1}` → **400 `INVALID_FIELD`** (not `IDEMPOTENCY_KEY_REUSED`). A malformed request is rejected before the idempotency lookup. *(§5 steps 1–5 before 5.5)*
- **[C-34b]** **Step 5.5 replay beats 6/7 (seen key + same seat replays, no re-decide):** reserve A1 with K1 (201). Resend K1 with same `seat_id:"A1"` → **verbatim replay of the stored 201** (byte-identical body + status), even though the seat is now `reserved` — replay wins, it does NOT fall through to step 7 `SEAT_TAKEN`. *(§5 step 5.5 replay before 6–7; §4.2)*
- **[C-34c]** **Step 5.5 KEY_REUSED beats 6 (SEAT_NOT_FOUND):** reserve A1 with K1 (201). Reuse K1 with a well-formed but nonexistent `seat_id:"Z9"` → **409 `IDEMPOTENCY_KEY_REUSED`** (not `404 SEAT_NOT_FOUND`). The key was seen with a different seat; that conflict is decided at 5.5, before seat existence at step 6. *(§5 step 5.5 before 6)*
- **[C-34d]** **Step 5.5 KEY_REUSED beats 7 (SEAT_TAKEN):** reserve A1 with K1 (201). Reserve A2 with K2 (201). Reuse K1 with `seat_id:"A2"` (a valid, already-reserved seat) → **409 `IDEMPOTENCY_KEY_REUSED`** (not `409 SEAT_TAKEN`) — both are 409 so the test MUST assert the `error.code` distinguishes them. *(§5 step 5.5 before 7)*
- **[C-34e]** **Unseen key falls through 5.5 to 6/7:** a brand-new key with `seat_id:"Z9"` → **404 `SEAT_NOT_FOUND`** at step 6 (not IDEMPOTENCY_KEY_REUSED), and this outcome is NOT recorded (see [C-43]). Confirms 5.5 is a no-op for unseen keys. *(§5 step 5.5 "unseen → continue"; §5.4)*

---

## E. Idempotent replay & recorded outcomes (SPEC §4.2, §5.4)

- **[C-35]** **Replay is byte-identical:** send a valid reserve, capture raw response bytes + status; resend the **same** `idempotency_key` (same seat, same body). Second response has the **identical HTTP status** and a **byte-identical body** to the first. Assert byte equality of the serialized body, not just deep-equal. *(§4.2 "byte-identical body and the identical status code")*
- **[C-36]** **Work done once:** count seats with `state:"reserved"` via `GET /seats` before and after the replay in **[C-35]**; the count MUST NOT increase on replay. *(§4.2 "WITHOUT performing the reservation work again"; §10.2 replay assertion)*
- **[C-37]** **201 success is recorded & replayed:** first request returns 201; replay returns the same recorded 201 body+status. *(§5.4 bullet 1)*
- **[C-38]** **409 SEAT_TAKEN is recorded & replayed:** key K1 reserves A1 (201); key K2 attempts A1 and gets 409 SEAT_TAKEN; replaying key K2 (same seat A1) returns the **byte-identical 409 SEAT_TAKEN** body+status, without new work. *(§5.4 bullet 2)*
- **[C-39]** **Key-reuse-with-different-seat → IDEMPOTENCY_KEY_REUSED:** key K1 reserves A1 (201); reuse key K1 with `seat_id:"A2"` → **409 `IDEMPOTENCY_KEY_REUSED`** (decided at step 5.5). Assert A2 is NOT reserved as a side effect (no silent second reservation), verified via `GET /seats`. *(§5.4 conflict rule; §5 step 5.5)*
- **[C-40]** **Request-shape 4xx are NOT recorded (INVALID_JSON):** send key K with an unparseable body → 400 INVALID_JSON; then send key K with a valid reservable seat → this MUST be a real attempt returning **201** (the earlier malformed call did not bind key K). *(§5.4 bullet 3)*
- **[C-41]** **Request-shape 4xx are NOT recorded (MISSING_FIELD):** send key K with `{}` → 400 MISSING_FIELD; resend key K with a valid seat → **201** real attempt. *(§5.4 bullet 3)*
- **[C-42]** **Request-shape 4xx are NOT recorded (INVALID_FIELD):** send key K with `{"seat_id":123,"idempotency_key":K}` → 400 INVALID_FIELD; resend key K valid → **201** real attempt. *(§5.4 bullet 3)*
- **[C-43]** **Request-shape 4xx are NOT recorded (SEAT_NOT_FOUND):** send key K with `seat_id:"Z9"` → 404 SEAT_NOT_FOUND; resend key K with a valid seeded seat → **201** real attempt. *(§5.4 bullet 3 — SEAT_NOT_FOUND explicitly listed as not recorded)*
- **[C-44]** **Size/media 4xx are NOT recorded:** send key K triggering 413 or 415; resend key K valid → **201** real attempt. *(§5.4 bullet 3 "size/media errors … NOT recorded")*

---

## F. Malformed-input battery — documented 4xx, NEVER 500 (SPEC §6)

Each item asserts (a) HTTP status is a **documented §5 4xx** with the expected
`error.code`, AND (b) status is **never 500**, AND (c) the connection is not
dropped/hung (a response is received). *(§6)*

- **[C-45]** Empty body with JSON content-type → 400 `INVALID_JSON` (not 500). *(§6; §5 step 3)*
- **[C-46]** Whitespace-only body (e.g. `"   "`) → 400 `INVALID_JSON` (not 500). *(§6)*
- **[C-47]** Truncated JSON (e.g. `{"seat_id":"A1"`) → 400 `INVALID_JSON` (not 500). *(§6)*
- **[C-48]** Top-level JSON array `[]` → 400 `INVALID_JSON` (not an object). *(§6; §5 step 3)*
- **[C-49]** Top-level JSON string `"A1"` → 400 `INVALID_JSON`. *(§6)*
- **[C-50]** Top-level JSON number `42` → 400 `INVALID_JSON`. *(§6)*
- **[C-51]** Duplicate keys in body (e.g. `{"seat_id":"A1","seat_id":"A2","idempotency_key":"k"}`) → resolves to a documented 4xx, never 500. *(§6 "duplicate keys")*
- **[C-52]** Deeply nested JSON (large nesting depth) → documented 4xx, never 500 and no crash/hang. *(§6 "deeply nested JSON")*
- **[C-53]** Non-UTF-8 bytes in body → documented 4xx (e.g. 400 `INVALID_JSON`), never 500. *(§6 "non-UTF-8 bytes")*
- **[C-54]** `seat_id` wrong type `{"seat_id":123,"idempotency_key":"k"}` → 400 `INVALID_FIELD` (not 500). *(§6; §5 step 5)*
- **[C-55]** `idempotency_key` wrong type `{"seat_id":"A1","idempotency_key":{}}` → 400 `INVALID_FIELD` (not 500). *(§6)*
- **[C-56]** Null field `{"seat_id":null,"idempotency_key":"k"}` → 400 `MISSING_FIELD` (absent/null). *(§6; §5 step 4)*
- **[C-57]** Empty-string field `{"seat_id":"","idempotency_key":"k"}` → 400 `INVALID_FIELD`. *(§6; §5 step 5)*
- **[C-58]** Oversized `idempotency_key` (201+ chars), otherwise valid → 400 `INVALID_FIELD`. *(§6; §4.2)*
- **[C-59]** **Missing/absent `Content-Type` on a POST with a body → 415 `UNSUPPORTED_MEDIA_TYPE`** (strict). Header entirely absent + non-empty body is treated as non-JSON, identical to a wrong `Content-Type`. Assert 415 `UNSUPPORTED_MEDIA_TYPE` at step 2, before any JSON parse. *(§5 step 2 + table, A3 ruling; §6 "Missing Content-Type")*

  > **[A3 — RESOLVED by architect, folded into SPEC §5 step 2 + table]** Missing/absent
  > `Content-Type` on a request carrying a body is strictly treated as non-JSON → 415.
  > No lenient fallback to JSON parsing. This is now binding.
- **[C-60]** Wrong `Content-Type` (e.g. `text/plain`) on a POST with a body → 415 `UNSUPPORTED_MEDIA_TYPE`. *(§6; §5 step 2)*
- **[C-61]** Body exceeding 64 KiB → 413 `PAYLOAD_TOO_LARGE`, never 500/hang. *(§6 boundary; §5 step 1)*
- **[C-62]** **Aggregate invariant:** across the entire malformed battery, assert no response ever has status 500. A 500 on any listed malformed input is a FAILURE, not an accepted outcome. The `INTERNAL`/500 catch-all (§6) must never be reached by these inputs. *(§6 final paragraph)*

---

## G. Concurrency invariants (SPEC §7, §10)

- **[C-63]** **Distinct-key race, one winner:** fire **≥100** concurrent `POST /reserve` at one available seat, each with a **distinct** idempotency_key. Assert **exactly one** response is `201` (`status:"reserved"`) and **all others** are `409 SEAT_TAKEN`. No third outcome. *(§7 invariant; §10.2 concurrency)*
- **[C-64]** **Seat reserved exactly once:** after the **[C-63]** race, `GET /seats` shows the target seat `reserved` exactly once and no other seat changed; the count of reserved seats increased by exactly 1. *(§7 "seat ends reserved exactly once"; §10)*
- **[C-65]** **At-most-one-201 global invariant:** never is more than one `201` produced for a given `seat_id`, under any concurrency. (Assert total 201 count for the target seat == 1 in **[C-63]**.) *(§7 "at most one 201 … for a given seat_id")*
- **[C-66]** **Same-key race, one reservation + identical responses:** fire **≥100** concurrent `POST /reserve` with the **same** idempotency_key and same seat. Assert exactly one reservation occurred (reserved-seat count rises by 1) AND **all N responses are identical** (same status, byte-identical body). Explicitly assert there is **no** two-`201` outcome and **no** `201`+`409` split. *(§7 idempotency-under-concurrency; §10.2)*
- **[C-67]** **Atomic critical section (structural — SUPPORTING evidence):** the reserve check-and-set (§5 steps 6→8) contains no `await`/I/O/timer between the availability read and the reserved write, and the full request body is read **before** entering the critical section. Verify by code inspection / static grep of `src/store.js` reserve path (`file:line`). **Required but supporting** — it does not by itself substitute for the behavioral tests. *(§7 design constraint, A4 ruling; §2 concurrency model)*

  > **[A4 — RESOLVED by architect, folded into SPEC §7]** The ≥100-concurrent
  > behavioral tests [C-63]–[C-66] are the **BINDING** evidence and MUST pass. The
  > structural no-`await` check [C-67] is a **required supporting** assertion only; a
  > passing structural check with a failing behavioral test still rejects the handoff.

---

## H. Operational (SPEC §8, §9, §10)

- **[C-68]** `createServer()` is exported as a factory returning a `http.Server` and can be started on an ephemeral port (`listen(0)`) without a fixed port — tests bind `:0` and read the assigned port. *(§8 factory; §9 layout)*
- **[C-69]** A `start()` entrypoint reads `PORT` from env (default `3000`) and listens on `127.0.0.1`. *(§8)*
- **[C-70]** All responses (success and error) set `Content-Type: application/json; charset=utf-8`. *(§8 — cross-check with [C-02],[C-12],[C-15])*
- **[C-71]** In-memory store: state does not survive restart; a fresh `createServer()` starts with all 6 seats `available`. *(§2 storage; §3)*
- **[C-72]** Repository layout exists under `dry-run/`: `package.json` (scripts `start`, `test`), `src/server.js`, `src/store.js`, `test/*.test.js`, `README.md`. *(§9)*
- **[C-73]** **Gate step 1 — syntax:** `node --check` exits 0 on every `src/**.js` and `test/**.js`. *(§10.1)*
- **[C-74]** **Gate step 2 — tests:** `npm test` (`node --test`) runs start-to-finish (no `| tail`/`| grep`) and every test exits 0, including all clusters above. *(§10.2)*
- **[C-75]** **Gate step 3 — format:** if a formatter is configured, `--check` exits 0; if none, README/gate explicitly states this step is N/A. *(§10.3)*

---

## Ambiguities — ALL RESOLVED by architect and folded into SPEC + this checklist

All four are decided; grading rulings now live in SPEC.md, mirrored here. No open
questions remain — the builder codes against this checklist directly.

- **A1** — RESOLVED: `error.message` is free-form, NOT contractual. Assert only `error.code` + HTTP status. → [C-16]..[C-25].
- **A2** — RESOLVED: new **step 5.5** idempotency lookup, after shape validation (1–5) and before seat existence/availability (6–7). Seen key + same seat → verbatim replay; seen key + different seat → 409 `IDEMPOTENCY_KEY_REUSED`; unseen → continue. → [C-34a]..[C-34e], [C-25], [C-39].
- **A3** — RESOLVED: missing/absent `Content-Type` with a body → 415 `UNSUPPORTED_MEDIA_TYPE` (strict). → [C-59].
- **A4** — RESOLVED: ≥100-concurrent behavioral tests [C-63]–[C-66] are BINDING and must pass; structural no-`await` check [C-67] is required but only supporting. → [C-63]..[C-67].

---

## Out of scope — MUST NOT appear (SPEC §11)

- **[C-76]** No auth, no persistence, no seat release/cancel, no multi-seat reservation, no pagination, no rate limiting, no TLS. Absence of these MUST NOT block sign-off, and presence of a release/unreserve operation would contradict §3. *(§11)*

---

*End of checklist. 81 items ([C-01]..[C-76] plus step-5.5 items [C-34a]..[C-34e]).
Verdict to be filled at Phase 2 against the running code and observed responses —
not against the implementer's report.*
