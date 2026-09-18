'use strict';

// Cluster E — idempotent replay & recorded outcomes (SPEC §4.2, §5.4).
// [C-35]..[C-44]

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withServer, request, reserve, getSeats, reservedCount } = require('./helper');

test('[C-35] replay is byte-identical body + identical status', async () => {
  await withServer(async (base) => {
    const first = await reserve(base, { seat_id: 'A1', idempotency_key: 'rk' });
    const second = await reserve(base, { seat_id: 'A1', idempotency_key: 'rk' });
    assert.equal(first.status, 201);
    assert.equal(second.status, first.status);
    assert.ok(second.raw.equals(first.raw), 'replay body must be byte-identical');
  });
});

test('[C-36] work done once: reserved count does not increase on replay', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'rk' });
    const before = reservedCount(await getSeats(base));
    await reserve(base, { seat_id: 'A1', idempotency_key: 'rk' }); // replay
    const after = reservedCount(await getSeats(base));
    assert.equal(after, before);
  });
});

test('[C-37] 201 success is recorded & replayed', async () => {
  await withServer(async (base) => {
    const a = await reserve(base, { seat_id: 'B1', idempotency_key: 'k37' });
    const b = await reserve(base, { seat_id: 'B1', idempotency_key: 'k37' });
    assert.equal(a.status, 201);
    assert.equal(b.status, 201);
    assert.ok(b.raw.equals(a.raw));
  });
});

test('[C-38] 409 SEAT_TAKEN is recorded & replayed byte-identically', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'K1' });
    const taken = await reserve(base, { seat_id: 'A1', idempotency_key: 'K2' });
    assert.equal(taken.status, 409);
    assert.equal(taken.json().error.code, 'SEAT_TAKEN');
    const before = reservedCount(await getSeats(base));
    const replay = await reserve(base, { seat_id: 'A1', idempotency_key: 'K2' });
    assert.equal(replay.status, 409);
    assert.ok(replay.raw.equals(taken.raw));
    const after = reservedCount(await getSeats(base));
    assert.equal(after, before, 'no new work on replay');
  });
});

test('[C-39] key reuse with different seat -> 409 IDEMPOTENCY_KEY_REUSED, no side effect', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'K1' });
    const res = await reserve(base, { seat_id: 'A2', idempotency_key: 'K1' });
    assert.equal(res.status, 409);
    assert.equal(res.json().error.code, 'IDEMPOTENCY_KEY_REUSED');
    const seats = await getSeats(base);
    const a2 = seats.seats.find((s) => s.seat_id === 'A2');
    assert.equal(a2.state, 'available', 'A2 must NOT be reserved as a side effect');
  });
});

test('[C-40] INVALID_JSON is NOT recorded; retry with valid -> 201', async () => {
  await withServer(async (base) => {
    const bad = await reserve(base, '{ not json');
    assert.equal(bad.status, 400);
    assert.equal(bad.json().error.code, 'INVALID_JSON');
    const good = await reserve(base, { seat_id: 'A1', idempotency_key: 'shared' });
    assert.equal(good.status, 201);
  });
});

test('[C-41] MISSING_FIELD is NOT recorded; retry with valid -> 201', async () => {
  await withServer(async (base) => {
    const bad = await reserve(base, '{}');
    assert.equal(bad.status, 400);
    assert.equal(bad.json().error.code, 'MISSING_FIELD');
    const good = await reserve(base, { seat_id: 'A1', idempotency_key: 'shared' });
    assert.equal(good.status, 201);
  });
});

test('[C-42] INVALID_FIELD is NOT recorded; retry with valid -> 201', async () => {
  await withServer(async (base) => {
    const bad = await reserve(base, { seat_id: 123, idempotency_key: 'shared' });
    assert.equal(bad.status, 400);
    assert.equal(bad.json().error.code, 'INVALID_FIELD');
    const good = await reserve(base, { seat_id: 'A1', idempotency_key: 'shared' });
    assert.equal(good.status, 201);
  });
});

test('[C-43] SEAT_NOT_FOUND is NOT recorded; retry with valid seat -> 201', async () => {
  await withServer(async (base) => {
    const bad = await reserve(base, { seat_id: 'Z9', idempotency_key: 'shared' });
    assert.equal(bad.status, 404);
    assert.equal(bad.json().error.code, 'SEAT_NOT_FOUND');
    const good = await reserve(base, { seat_id: 'A1', idempotency_key: 'shared' });
    assert.equal(good.status, 201);
  });
});

test('[C-44] size/media 4xx are NOT recorded; retry with valid -> 201', async () => {
  await withServer(async (base) => {
    // 415 media error under the key.
    const media = await request(base, {
      method: 'POST',
      path: '/reserve',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ seat_id: 'A1', idempotency_key: 'shared' }),
    });
    assert.equal(media.status, 415);
    const good = await reserve(base, { seat_id: 'A1', idempotency_key: 'shared' });
    assert.equal(good.status, 201);
  });
});
