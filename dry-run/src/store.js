'use strict';

// In-memory seat + idempotency store for the seat reservation service.
//
// SPEC §2 (storage): in-process, in-memory; state does not survive a restart.
// SPEC §7 / CONFORMANCE [C-67]: the reserve check-and-set MUST be a single
// atomic critical section — no `await`, I/O, or timer between the availability
// read and the reserved write. Everything in this file is synchronous by
// design so the guard cannot be bypassed by a future async caller. The HTTP
// layer reads the FULL request body before calling reserve().

// SPEC §3: fixed, known seed set — 6 seats, all initially "available".
const SEED_SEATS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

const SEAT_TAKEN_BODY = JSON.stringify({
  error: { code: 'SEAT_TAKEN', message: 'Seat is already reserved.' },
});

function createStore() {
  // seat_id -> "available" | "reserved"
  const seats = new Map();
  for (const id of SEED_SEATS) {
    seats.set(id, 'available');
  }

  // idempotency_key -> { seat_id, status, body }  (SPEC §3 reservation record)
  // `body` is the exact serialized string first produced, so replays are
  // byte-identical (SPEC §4.2, CONFORMANCE [C-35]).
  const records = new Map();

  // SPEC §4.1: list all seats, ascending by seat_id, deterministic.
  function listSeats() {
    return [...seats.keys()].sort().map((seat_id) => ({
      seat_id,
      state: seats.get(seat_id),
    }));
  }

  // Reserve one seat. Called ONLY after the HTTP layer has fully read the body
  // and validated request shape (SPEC §5 steps 1–5). Handles steps 6–8 plus the
  // idempotency lookup as one synchronous, non-suspending critical section.
  //
  // Returns a descriptor the HTTP layer maps to a response:
  //   { kind: 'created',        status, body }
  //   { kind: 'taken',          status, body }   (409 SEAT_TAKEN, recorded)
  //   { kind: 'replay',         status, body }   (byte-identical prior response)
  //   { kind: 'reuse_conflict' }                 (-> 409 IDEMPOTENCY_KEY_REUSED)
  //   { kind: 'seat_not_found' }                 (-> 404 SEAT_NOT_FOUND, not recorded)
  function reserve(seat_id, idempotency_key) {
    // --- Idempotency lookup (SPEC §4.2 replay, §5.4 conflict rule) ---
    // A2 (pending architect): a recognized key short-circuits — replay when it
    // targets the same seat, else IDEMPOTENCY_KEY_REUSED — before the seat
    // availability decision (steps 6–8).
    const prior = records.get(idempotency_key);
    if (prior !== undefined) {
      if (prior.seat_id === seat_id) {
        return { kind: 'replay', status: prior.status, body: prior.body };
      }
      return { kind: 'reuse_conflict' };
    }

    // --- Step 6: seat must exist (SEAT_NOT_FOUND is NOT recorded, §5.4) ---
    if (!seats.has(seat_id)) {
      return { kind: 'seat_not_found' };
    }

    // --- Steps 7–8: ATOMIC critical section. No await / I/O / timer below. ---
    if (seats.get(seat_id) === 'available') {
      seats.set(seat_id, 'reserved');
      const body = JSON.stringify({
        status: 'reserved',
        seat_id,
        idempotency_key,
      });
      records.set(idempotency_key, { seat_id, status: 201, body });
      return { kind: 'created', status: 201, body };
    }

    // Seat reserved by a different key -> 409 SEAT_TAKEN, recorded so replaying
    // this key returns the byte-identical body (SPEC §5.4 bullet 2, [C-38]).
    records.set(idempotency_key, { seat_id, status: 409, body: SEAT_TAKEN_BODY });
    return { kind: 'taken', status: 409, body: SEAT_TAKEN_BODY };
    // --- end critical section ---
  }

  return { listSeats, reserve };
}

module.exports = { createStore, SEED_SEATS };
