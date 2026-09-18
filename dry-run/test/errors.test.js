'use strict';

// Cluster C — documented error codes: exact status + exact error.code + envelope
// (SPEC §5). [C-14]..[C-25]

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withServer, request, reserve, JSON_HEADERS } = require('./helper');

function assertEnvelope(res, status, code) {
  assert.equal(res.status, status);
  assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
  const body = res.json();
  assert.deepEqual(Object.keys(body), ['error']);
  assert.deepEqual(Object.keys(body.error).sort(), ['code', 'message']);
  assert.equal(typeof body.error.code, 'string');
  assert.equal(typeof body.error.message, 'string');
  assert.equal(body.error.code, code);
}

test('[C-14][C-15] error envelope shape + Content-Type', async () => {
  await withServer(async (base) => {
    const res = await request(base, { path: '/nope' });
    assertEnvelope(res, 404, 'NOT_FOUND');
  });
});

test('[C-16] INVALID_JSON -> 400', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, 'not json');
    assertEnvelope(res, 400, 'INVALID_JSON');
  });
});

test('[C-17] MISSING_FIELD -> 400', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, { idempotency_key: 'k' });
    assertEnvelope(res, 400, 'MISSING_FIELD');
  });
});

test('[C-18] INVALID_FIELD -> 400 (wrong type)', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, { seat_id: 123, idempotency_key: 'k' });
    assertEnvelope(res, 400, 'INVALID_FIELD');
  });
});

test('[C-19] SEAT_NOT_FOUND -> 404', async () => {
  await withServer(async (base) => {
    const res = await reserve(base, { seat_id: 'Z9', idempotency_key: 'k' });
    assertEnvelope(res, 404, 'SEAT_NOT_FOUND');
  });
});

test('[C-20] SEAT_TAKEN -> 409 (different key)', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'k1' });
    const res = await reserve(base, { seat_id: 'A1', idempotency_key: 'k2' });
    assertEnvelope(res, 409, 'SEAT_TAKEN');
  });
});

test('[C-21] METHOD_NOT_ALLOWED -> 405 (GET /reserve and POST /seats)', async () => {
  await withServer(async (base) => {
    const a = await request(base, { method: 'GET', path: '/reserve' });
    assertEnvelope(a, 405, 'METHOD_NOT_ALLOWED');
    const b = await request(base, { method: 'POST', path: '/seats', headers: JSON_HEADERS, body: '{}' });
    assertEnvelope(b, 405, 'METHOD_NOT_ALLOWED');
  });
});

test('[C-22] NOT_FOUND -> 404 (unknown path)', async () => {
  await withServer(async (base) => {
    const a = await request(base, { method: 'GET', path: '/nope' });
    assertEnvelope(a, 404, 'NOT_FOUND');
    const b = await request(base, { method: 'POST', path: '/reserve/extra', headers: JSON_HEADERS, body: '{}' });
    assertEnvelope(b, 404, 'NOT_FOUND');
  });
});

test('[C-23] PAYLOAD_TOO_LARGE -> 413 (> 64 KiB)', async () => {
  await withServer(async (base) => {
    const big = 'x'.repeat(65537);
    const res = await reserve(base, big);
    assertEnvelope(res, 413, 'PAYLOAD_TOO_LARGE');
  });
});

test('[C-24] UNSUPPORTED_MEDIA_TYPE -> 415 (body + non-JSON Content-Type)', async () => {
  await withServer(async (base) => {
    const res = await request(base, {
      method: 'POST',
      path: '/reserve',
      headers: { 'Content-Type': 'text/plain' },
      body: '{"seat_id":"A1","idempotency_key":"k"}',
    });
    assertEnvelope(res, 415, 'UNSUPPORTED_MEDIA_TYPE');
  });
});

test('[C-25] IDEMPOTENCY_KEY_REUSED -> 409 (key reused with different seat)', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'kdup' });
    const res = await reserve(base, { seat_id: 'A2', idempotency_key: 'kdup' });
    assertEnvelope(res, 409, 'IDEMPOTENCY_KEY_REUSED');
  });
});
