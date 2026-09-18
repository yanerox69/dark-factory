'use strict';

// Cluster A — GET /seats shape & ordering (SPEC §4.1). [C-01]..[C-09]

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withServer, request, reserve, getSeats } = require('./helper');

const SEEDED = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

test('[C-01] GET /seats returns 200', async () => {
  await withServer(async (base) => {
    const res = await request(base, { path: '/seats' });
    assert.equal(res.status, 200);
  });
});

test('[C-02] GET /seats Content-Type is application/json; charset=utf-8', async () => {
  await withServer(async (base) => {
    const res = await request(base, { path: '/seats' });
    assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
  });
});

test('[C-03] body is an object with single top-level array key `seats`', async () => {
  await withServer(async (base) => {
    const body = await getSeats(base);
    assert.deepEqual(Object.keys(body), ['seats']);
    assert.ok(Array.isArray(body.seats));
  });
});

test('[C-04] each seat has exactly keys seat_id and state', async () => {
  await withServer(async (base) => {
    const body = await getSeats(base);
    for (const seat of body.seats) {
      assert.deepEqual(Object.keys(seat).sort(), ['seat_id', 'state']);
    }
  });
});

test('[C-05] seat_id is string, state is available|reserved only', async () => {
  await withServer(async (base) => {
    const body = await getSeats(base);
    for (const seat of body.seats) {
      assert.equal(typeof seat.seat_id, 'string');
      assert.ok(seat.state === 'available' || seat.state === 'reserved');
    }
  });
});

test('[C-06] fresh server seeds exactly the 6 ids, all available', async () => {
  await withServer(async (base) => {
    const body = await getSeats(base);
    assert.equal(body.seats.length, 6);
    assert.deepEqual(body.seats.map((s) => s.seat_id).sort(), [...SEEDED]);
    assert.ok(body.seats.every((s) => s.state === 'available'));
  });
});

test('[C-07] seats ordered ascending by seat_id, deterministic', async () => {
  await withServer(async (base) => {
    const a = await getSeats(base);
    const b = await getSeats(base);
    assert.deepEqual(a.seats.map((s) => s.seat_id), SEEDED);
    assert.deepEqual(b.seats.map((s) => s.seat_id), SEEDED);
  });
});

test('[C-08] unknown query params are ignored', async () => {
  await withServer(async (base) => {
    const res = await request(base, { path: '/seats?foo=bar' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json().seats.map((s) => s.seat_id), SEEDED);
  });
});

test('[C-09] after a reservation the seat shows reserved, others unchanged', async () => {
  await withServer(async (base) => {
    const r = await reserve(base, { seat_id: 'A2', idempotency_key: 'k-c09' });
    assert.equal(r.status, 201);
    const body = await getSeats(base);
    for (const seat of body.seats) {
      if (seat.seat_id === 'A2') assert.equal(seat.state, 'reserved');
      else assert.equal(seat.state, 'available');
    }
  });
});
