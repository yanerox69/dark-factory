'use strict';

// Cluster F — malformed-input battery: documented 4xx, NEVER 500 (SPEC §6).
// [C-45]..[C-62]

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withServer, request, reserve, JSON_HEADERS } = require('./helper');

// Every case records its status; the aggregate invariant [C-62] asserts none is 500.
const observed = [];

function jsonPost(base, body, headers = JSON_HEADERS) {
  return request(base, { method: 'POST', path: '/reserve', headers, body });
}

async function expect4xx(base, opts, expectedCode) {
  const res = typeof opts === 'function' ? await opts(base) : await jsonPost(base, opts);
  observed.push(res.status);
  assert.notEqual(res.status, 500, 'must never be 500');
  assert.ok(res.status >= 400 && res.status < 500, `expected 4xx, got ${res.status}`);
  const code = res.json().error.code;
  if (expectedCode) assert.equal(code, expectedCode);
  return res;
}

test('[C-45] empty body + JSON CT -> 400 INVALID_JSON', async () => {
  await withServer((base) => expect4xx(base, '', 'INVALID_JSON'));
});

test('[C-46] whitespace-only body -> 400 INVALID_JSON', async () => {
  await withServer((base) => expect4xx(base, '   ', 'INVALID_JSON'));
});

test('[C-47] truncated JSON -> 400 INVALID_JSON', async () => {
  await withServer((base) => expect4xx(base, '{"seat_id":"A1"', 'INVALID_JSON'));
});

test('[C-48] top-level array [] -> 400 INVALID_JSON', async () => {
  await withServer((base) => expect4xx(base, '[]', 'INVALID_JSON'));
});

test('[C-49] top-level string -> 400 INVALID_JSON', async () => {
  await withServer((base) => expect4xx(base, '"A1"', 'INVALID_JSON'));
});

test('[C-50] top-level number -> 400 INVALID_JSON', async () => {
  await withServer((base) => expect4xx(base, '42', 'INVALID_JSON'));
});

test('[C-51] duplicate keys -> documented 4xx, never 500', async () => {
  await withServer((base) =>
    expect4xx(base, '{"seat_id":"A1","seat_id":"A2","idempotency_key":"k"}')
  );
});

test('[C-52] deeply nested JSON -> documented 4xx, never 500/hang', async () => {
  await withServer((base) => {
    const deep = '['.repeat(2000) + ']'.repeat(2000);
    return expect4xx(base, deep);
  });
});

test('[C-53] non-UTF-8 bytes -> documented 4xx, never 500', async () => {
  await withServer((base) =>
    expect4xx(base, () => jsonPost(base, Buffer.from([0xff, 0xfe, 0x00, 0x80])))
  );
});

test('[C-54] seat_id wrong type -> 400 INVALID_FIELD', async () => {
  await withServer((base) => expect4xx(base, '{"seat_id":123,"idempotency_key":"k"}', 'INVALID_FIELD'));
});

test('[C-55] idempotency_key wrong type -> 400 INVALID_FIELD', async () => {
  await withServer((base) => expect4xx(base, '{"seat_id":"A1","idempotency_key":{}}', 'INVALID_FIELD'));
});

test('[C-56] null field -> 400 MISSING_FIELD', async () => {
  await withServer((base) => expect4xx(base, '{"seat_id":null,"idempotency_key":"k"}', 'MISSING_FIELD'));
});

test('[C-57] empty-string field -> 400 INVALID_FIELD', async () => {
  await withServer((base) => expect4xx(base, '{"seat_id":"","idempotency_key":"k"}', 'INVALID_FIELD'));
});

test('[C-58] oversized idempotency_key -> 400 INVALID_FIELD', async () => {
  await withServer((base) =>
    expect4xx(base, JSON.stringify({ seat_id: 'A1', idempotency_key: 'x'.repeat(201) }), 'INVALID_FIELD')
  );
});

test('[C-59] missing Content-Type with body -> 415 UNSUPPORTED_MEDIA_TYPE', async () => {
  await withServer((base) =>
    expect4xx(
      base,
      () =>
        request(base, {
          method: 'POST',
          path: '/reserve',
          headers: {}, // no Content-Type
          body: Buffer.from('{"seat_id":"A1","idempotency_key":"k"}'),
        }),
      'UNSUPPORTED_MEDIA_TYPE'
    )
  );
});

test('[C-60] wrong Content-Type with body -> 415 UNSUPPORTED_MEDIA_TYPE', async () => {
  await withServer((base) =>
    expect4xx(
      base,
      () => jsonPost(base, '{"seat_id":"A1","idempotency_key":"k"}', { 'Content-Type': 'text/plain' }),
      'UNSUPPORTED_MEDIA_TYPE'
    )
  );
});

test('[C-61] body exceeding 64 KiB -> 413 PAYLOAD_TOO_LARGE', async () => {
  await withServer((base) => expect4xx(base, 'x'.repeat(65537), 'PAYLOAD_TOO_LARGE'));
});

test('[C-62] aggregate invariant: no malformed input ever produced 500', () => {
  assert.ok(observed.length > 0, 'battery must have run');
  assert.ok(!observed.includes(500), `saw a 500 in ${JSON.stringify(observed)}`);
});
