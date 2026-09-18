'use strict';

// Cluster D — validation precedence, first-failure-wins (SPEC §5 steps 1–8).
// [C-26]..[C-34]

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withServer, request, reserve } = require('./helper');

function code(res) {
  return res.json().error.code;
}

test('[C-26] step 1 beats 2: oversize + text/plain -> 413', async () => {
  await withServer(async (base) => {
    const res = await request(base, {
      method: 'POST',
      path: '/reserve',
      headers: { 'Content-Type': 'text/plain' },
      body: 'x'.repeat(65537),
    });
    assert.equal(res.status, 413);
    assert.equal(code(res), 'PAYLOAD_TOO_LARGE');
  });
});

test('[C-27] step 2 beats 3: text/plain + garbage -> 415', async () => {
  await withServer(async (base) => {
    const res = await request(base, {
      method: 'POST',
      path: '/reserve',
      headers: { 'Content-Type': 'text/plain' },
      body: 'garbage <<',
    });
    assert.equal(res.status, 415);
    assert.equal(code(res), 'UNSUPPORTED_MEDIA_TYPE');
  });
});

test('[C-28] step 3 beats 4: JSON CT + unparseable -> 400 INVALID_JSON', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, 'not json');
    assert.equal(res.status, 400);
    assert.equal(code(res), 'INVALID_JSON');
  });
});

test('[C-29] step 3 object-check beats 4: top-level array -> 400 INVALID_JSON', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, '[]');
    assert.equal(res.status, 400);
    assert.equal(code(res), 'INVALID_JSON');
  });
});

test('[C-30] step 4 beats 5: {} -> 400 MISSING_FIELD', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, '{}');
    assert.equal(res.status, 400);
    assert.equal(code(res), 'MISSING_FIELD');
  });
});

test('[C-31] step 5 beats 6: bad seat_id type/empty -> 400 INVALID_FIELD', async () => {
  await withServer(async (base) => {
    const a = await reserve(base, { seat_id: 123, idempotency_key: 'k' });
    assert.equal(a.status, 400);
    assert.equal(code(a), 'INVALID_FIELD');
    const b = await reserve(base, { seat_id: '', idempotency_key: 'k' });
    assert.equal(b.status, 400);
    assert.equal(code(b), 'INVALID_FIELD');
  });
});

test('[C-32] step 6 beats 7: unknown seat -> 404 SEAT_NOT_FOUND even when seats taken', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'k1' }); // take a seat
    const res = await reserve(base, { seat_id: 'Z9', idempotency_key: 'k2' });
    assert.equal(res.status, 404);
    assert.equal(code(res), 'SEAT_NOT_FOUND');
  });
});

test('[C-33] step 7 beats 8: already reserved -> 409 SEAT_TAKEN (not a 2nd 201)', async () => {
  await withServer(async (base) => {
    const first = await reserve(base, { seat_id: 'A1', idempotency_key: 'k1' });
    assert.equal(first.status, 201);
    const res = await reserve(base, { seat_id: 'A1', idempotency_key: 'k2' });
    assert.equal(res.status, 409);
    assert.equal(code(res), 'SEAT_TAKEN');
  });
});

test('[C-34] idempotency_key length 201 -> 400 INVALID_FIELD (not 201)', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, { seat_id: 'A1', idempotency_key: 'x'.repeat(201) });
    assert.equal(res.status, 400);
    assert.equal(code(res), 'INVALID_FIELD');
  });
});
