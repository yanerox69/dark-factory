'use strict';

// Cluster B — POST /reserve happy path 201 (SPEC §4.2). [C-10]..[C-13]

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withServer, reserve } = require('./helper');

test('[C-10] valid reserve returns 201', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, { seat_id: 'A1', idempotency_key: 'abc-123' });
    assert.equal(res.status, 201);
  });
});

test('[C-11] 201 body has exactly the three documented keys/values', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, { seat_id: 'A1', idempotency_key: 'abc-123' });
    const body = res.json();
    assert.deepEqual(body, {
      status: 'reserved',
      seat_id: 'A1',
      idempotency_key: 'abc-123',
    });
    assert.deepEqual(Object.keys(body).sort(), ['idempotency_key', 'seat_id', 'status']);
  });
});

test('[C-12] 201 Content-Type is application/json; charset=utf-8', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, { seat_id: 'A1', idempotency_key: 'abc-123' });
    assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
  });
});

test('[C-13] extra unknown fields are ignored, still 201', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, { seat_id: 'A2', idempotency_key: 'k', junk: 1 });
    assert.equal(res.status, 201);
    assert.deepEqual(res.json(), {
      status: 'reserved',
      seat_id: 'A2',
      idempotency_key: 'k',
    });
  });
});
