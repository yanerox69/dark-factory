'use strict';

// Cluster H — operational (SPEC §8, §9). [C-68]..[C-71]
// (Gate items [C-72]..[C-75] are checked by the gate itself; [C-76] out-of-scope
//  is asserted below by absence of any release/cancel endpoint.)

const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer, start } = require('../src/server');
const { withServer, request, reserve } = require('./helper');

test('[C-68] createServer() returns an http.Server startable on :0', async () => {
  const server = createServer();
  assert.ok(server instanceof http.Server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  assert.ok(Number.isInteger(port) && port > 0);
  await new Promise((resolve) => server.close(resolve));
});

test('[C-69] start() reads PORT and listens on 127.0.0.1', async () => {
  const prev = process.env.PORT;
  process.env.PORT = '0';
  const server = start();
  await new Promise((resolve) => server.once('listening', resolve));
  const addr = server.address();
  assert.equal(addr.address, '127.0.0.1');
  await new Promise((resolve) => server.close(resolve));
  if (prev === undefined) delete process.env.PORT;
  else process.env.PORT = prev;
});

test('[C-70] all responses set application/json; charset=utf-8', async () => {
  await withServer(async (base) => {
    const seats = await request(base, { path: '/seats' });
    const created = await reserve(base, { seat_id: 'A1', idempotency_key: 'k70' });
    const err = await request(base, { path: '/nope' });
    for (const res of [seats, created, err]) {
      assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
    }
  });
});

test('[C-71] fresh createServer() starts with all 6 seats available', async () => {
  await withServer(async (base) => {
    await reserve(base, { seat_id: 'A1', idempotency_key: 'k' });
  });
  // A brand-new server must not remember the previous reservation.
  await withServer(async (base) => {
    const seats = (await request(base, { path: '/seats' })).json();
    assert.ok(seats.seats.every((s) => s.state === 'available'));
    assert.equal(seats.seats.length, 6);
  });
});

test('[C-76] no seat release/cancel endpoint exists (out of scope)', async () => {
  await withServer(async (base) => {
    for (const path of ['/release', '/cancel', '/unreserve']) {
      const res = await request(base, { method: 'POST', path, headers: { 'Content-Type': 'application/json' }, body: '{}' });
      assert.equal(res.status, 404);
      assert.equal(res.json().error.code, 'NOT_FOUND');
    }
  });
});
