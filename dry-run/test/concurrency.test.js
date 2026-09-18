'use strict';

// Cluster G — concurrency invariants (SPEC §7, §10). [C-63]..[C-66]
// ([C-67] is a structural code-inspection check on src/store.js reserve().)

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withServer, reserve, getSeats, reservedCount } = require('./helper');

const N = 120; // ≥ 100 concurrent requests

test('[C-63][C-65] distinct-key race: exactly one 201, rest 409 SEAT_TAKEN', async () => {
  await withServer(async (base) => {
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        reserve(base, { seat_id: 'A1', idempotency_key: `key-${i}` })
      )
    );
    const created = results.filter((r) => r.status === 201);
    const taken = results.filter(
      (r) => r.status === 409 && r.json().error.code === 'SEAT_TAKEN'
    );
    assert.equal(created.length, 1, 'exactly one 201 for the seat');
    assert.equal(taken.length, N - 1, 'all others 409 SEAT_TAKEN');
    assert.equal(created.length + taken.length, N, 'no third outcome');
    assert.equal(created[0].json().status, 'reserved');
  });
});

test('[C-64] seat reserved exactly once; reserved count rises by exactly 1', async () => {
  await withServer(async (base) => {
    const before = reservedCount(await getSeats(base));
    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        reserve(base, { seat_id: 'B2', idempotency_key: `k-${i}` })
      )
    );
    const seats = await getSeats(base);
    assert.equal(reservedCount(seats) - before, 1);
    assert.equal(seats.seats.find((s) => s.seat_id === 'B2').state, 'reserved');
    // no other seat changed
    for (const s of seats.seats) {
      if (s.seat_id !== 'B2') assert.equal(s.state, 'available');
    }
  });
});

test('[C-66] same-key race: one reservation, all responses identical', async () => {
  await withServer(async (base) => {
    const before = reservedCount(await getSeats(base));
    const results = await Promise.all(
      Array.from({ length: N }, () =>
        reserve(base, { seat_id: 'A3', idempotency_key: 'same-key' })
      )
    );
    const after = reservedCount(await getSeats(base));
    assert.equal(after - before, 1, 'exactly one reservation occurred');

    // All responses identical: same status, byte-identical body.
    const first = results[0];
    for (const r of results) {
      assert.equal(r.status, first.status);
      assert.ok(r.raw.equals(first.raw));
    }
    // No 201+409 split, no two-201 confusion.
    const statuses = new Set(results.map((r) => r.status));
    assert.equal(statuses.size, 1, 'all responses share one status');
    assert.equal(first.status, 201);
  });
});
