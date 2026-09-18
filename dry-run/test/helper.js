'use strict';

// Shared test utilities. Contains no test() calls, so if the runner discovers
// this file it simply registers zero tests and exits 0.

const http = require('node:http');
const { createServer } = require('../src/server');

// Start a fresh server on an ephemeral port, run fn(base), always close.
async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    return await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

// Low-level HTTP request with full control over method, headers, and raw body
// bytes (needed for missing/wrong Content-Type, non-UTF-8 bytes, duplicate
// keys, oversized bodies). `body` may be a string or a Buffer.
function request(base, { method = 'GET', path = '/', headers = {}, body } = {}) {
  const url = new URL(path, base);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            raw,
            text: raw.toString('utf8'),
            json() {
              return JSON.parse(raw.toString('utf8'));
            },
          });
        });
      }
    );
    req.on('error', reject);
    if (body !== undefined && body !== null) req.write(body);
    req.end();
  });
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Convenience: POST /reserve with a JSON string body.
function reserve(base, obj, headers = JSON_HEADERS) {
  return request(base, {
    method: 'POST',
    path: '/reserve',
    headers,
    body: typeof obj === 'string' ? obj : JSON.stringify(obj),
  });
}

async function getSeats(base) {
  const res = await request(base, { method: 'GET', path: '/seats' });
  return res.json();
}

function reservedCount(seatsBody) {
  return seatsBody.seats.filter((s) => s.state === 'reserved').length;
}

module.exports = {
  withServer,
  request,
  reserve,
  getSeats,
  reservedCount,
  JSON_HEADERS,
};
