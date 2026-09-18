'use strict';

// Cluster D.5 — step 5.5 idempotency-lookup ordering (SPEC §5 step 5.5, A2).
// [C-34a]..[C-34e]. Pins that 5.5 runs AFTER shape validation (steps 1–5) and
// BEFORE seat existence/availability (steps 6–7).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withServer, reserve, getSeats } = require('./helper');

function code(res) {
  return res.json().error.code;
}

test('[C-34a] step 5 beats 5.5: malformed shape on a seen key -> 400 INVALID_FIELD', async () => {
  await withServer(async (base) => {
    const first = await reserve(base, { seat_id: 'A1', idempotency_key: 'K1' });
    assert.equal(first.status, 201);
    // Reuse K1 but with a malformed seat_id type — shape rejection must win.
    const res = await reserve(base, '{"seat_id":123,"idempotency_key":"K1"}');
    assert.equal(res.status, 400);
    assert.equal(code(res), 'INVALID_FIELD');
  });
});

test('[C-34b] step 5.5 replay beats 6/7: seen key + same seat -> verbatim 201 replay (not SEAT_TAKEN)', async () => {
  await withServer(async (base) => {
    const first = await reserve(base, { seat_id: 'A1', idempotency_key: 'K1' });
    assert.equal(first.status, 201);
    // Seat is now reserved; a replay of the SAME key+seat must still replay 201.
    const replay = await reserve(base, { seat_id: 'A1', idempotency_key: 'K1' });
    assert.equal(replay.status, 201);
    assert.ok(replay.raw.equals(first.raw), 'byte-identical 201 replay');
  });
});

test('[C-34c] step 5.5 KEY_REUSED beats 6: seen key + nonexistent seat -> 409 IDEMPOTENCY_KEY_REUSED (not 404)', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'K1' });
    const res = await reserve(base, { seat_id: 'Z9', idempotency_key: 'K1' });
    assert.equal(res.status, 409);
    assert.equal(code(res), 'IDEMPOTENCY_KEY_REUSED');
  });
});

test('[C-34d] step 5.5 KEY_REUSED beats 7: seen key + different reserved seat -> IDEMPOTENCY_KEY_REUSED (not SEAT_TAKEN)', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'K1' });
    await reserve(base, { seat_id: 'A2', idempotency_key: 'K2' });
    // K1 originally bound A1; reusing it against the (reserved) A2 is a key reuse,
    // NOT a seat-taken condition. Both are 409 — the error.code must distinguish.
    const res = await reserve(base, { seat_id: 'A2', idempotency_key: 'K1' });
    assert.equal(res.status, 409);
    assert.equal(code(res), 'IDEMPOTENCY_KEY_REUSED');
    assert.notEqual(code(res), 'SEAT_TAKEN');
  });
});

test('[C-34e] unseen key falls through 5.5 to step 6: nonexistent seat -> 404 SEAT_NOT_FOUND, not recorded', async () => {
  await withServer(async (base) => {
    const miss = await reserve(base, { seat_id: 'Z9', idempotency_key: 'fresh' });
    assert.equal(miss.status, 404);
    assert.equal(code(miss), 'SEAT_NOT_FOUND');
    // Not recorded: retry same key with a valid seat gets a real attempt (201).
    const real = await reserve(base, { seat_id: 'A1', idempotency_key: 'fresh' });
    assert.equal(real.status, 201);
    const seats = await getSeats(base);
    assert.equal(seats.seats.find((s) => s.seat_id === 'A1').state, 'reserved');
  });
});
