'use strict';

// Seat reservation HTTP service. Zero runtime dependencies (SPEC §2).
//   - createServer(): factory returning an http.Server (SPEC §8, [C-68]).
//   - start(): reads PORT (default 3000), listens on 127.0.0.1 ([C-69]).
//
// Design invariants graded by CONFORMANCE.md:
//   - §5 validation precedence is first-failure-wins (steps 1–8).
//   - Every documented error uses the exact HTTP status + exact error.code.
//   - Malformed client input NEVER yields 500 (§6). A top-level catch maps any
//     unexpected throw to 500 INTERNAL, but no documented malformed input may
//     reach it.
//   - The dangerous check-and-set lives in store.js (the chokepoint); the body
//     is fully read here before store.reserve() is called (§7, [C-67]).

const http = require('node:http');
const { createStore } = require('./store');

const JSON_CT = 'application/json; charset=utf-8';
const MAX_BODY_BYTES = 65536; // 64 KiB hard cap (SPEC §5 step 1, [C-23])
const MAX_KEY_LEN = 200; // idempotency_key length ≤ 200 (SPEC §4.2, [C-18])

// HTTP status + free-form human message per documented code. A1 (pending
// architect): `message` text is NOT part of the graded contract; only `code`
// and status are asserted. Codes/statuses below are the literal contract.
const ERRORS = {
  INVALID_JSON: [400, 'Request body is not valid JSON.'],
  MISSING_FIELD: [400, 'seat_id and idempotency_key are required.'],
  INVALID_FIELD: [400, 'A field has an invalid value.'],
  SEAT_NOT_FOUND: [404, 'Seat does not exist.'],
  SEAT_TAKEN: [409, 'Seat is already reserved.'],
  METHOD_NOT_ALLOWED: [405, 'Method not allowed for this path.'],
  NOT_FOUND: [404, 'Resource not found.'],
  PAYLOAD_TOO_LARGE: [413, 'Request body exceeds the 64 KiB limit.'],
  UNSUPPORTED_MEDIA_TYPE: [415, 'Content-Type must be application/json.'],
  IDEMPOTENCY_KEY_REUSED: [409, 'idempotency_key reused with a different seat_id.'],
  INTERNAL: [500, 'Internal server error.'],
};

function send(res, status, bodyStr) {
  res.writeHead(status, {
    'Content-Type': JSON_CT,
    'Content-Length': Buffer.byteLength(bodyStr),
  });
  res.end(bodyStr);
}

function sendError(res, code) {
  const [status, message] = ERRORS[code];
  send(res, status, JSON.stringify({ error: { code, message } }));
}

// SPEC §5 step 2: Content-Type must be JSON. Accepts optional parameters such
// as "; charset=utf-8".
function isJsonContentType(ct) {
  if (typeof ct !== 'string') return false;
  return ct.split(';')[0].trim().toLowerCase() === 'application/json';
}

// SPEC §6 lists "duplicate keys" as malformed input that must resolve to a
// documented 4xx (never 500). JSON.parse silently keeps the last duplicate, so
// we scan the (already valid) JSON text and flag any object with a repeated key.
// The scanner is read-only and assumes the text already parsed successfully.
function hasDuplicateKeys(text) {
  const n = text.length;
  let i = 0;
  const stack = []; // frames: { obj: bool, keys: Set|null, expectKey: bool }

  function skipWs() {
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) i++;
      else break;
    }
  }

  function readString() {
    // text[i] === '"'
    i++;
    let s = '';
    while (i < n) {
      const c = text[i++];
      if (c === '\\') {
        const e = text[i++];
        if (e === 'u') {
          s += String.fromCharCode(parseInt(text.slice(i, i + 4), 16));
          i += 4;
        } else {
          switch (e) {
            case 'n': s += '\n'; break;
            case 't': s += '\t'; break;
            case 'r': s += '\r'; break;
            case 'b': s += '\b'; break;
            case 'f': s += '\f'; break;
            case '"': s += '"'; break;
            case '\\': s += '\\'; break;
            case '/': s += '/'; break;
            default: s += e;
          }
        }
      } else if (c === '"') {
        return s;
      } else {
        s += c;
      }
    }
    return s;
  }

  while (i < n) {
    skipWs();
    if (i >= n) break;
    const ch = text[i];

    if (ch === '{') {
      i++;
      stack.push({ obj: true, keys: new Set(), expectKey: true });
    } else if (ch === '[') {
      i++;
      stack.push({ obj: false, keys: null, expectKey: false });
    } else if (ch === '}' || ch === ']') {
      i++;
      stack.pop();
    } else if (ch === ',') {
      i++;
      const top = stack[stack.length - 1];
      if (top && top.obj) top.expectKey = true;
    } else if (ch === ':') {
      i++;
      const top = stack[stack.length - 1];
      if (top && top.obj) top.expectKey = false;
    } else if (ch === '"') {
      const top = stack[stack.length - 1];
      const isKey = !!(top && top.obj && top.expectKey);
      const str = readString();
      if (isKey) {
        if (top.keys.has(str)) return true;
        top.keys.add(str);
      }
    } else {
      // number / true / false / null literal — advance one char at a time.
      i++;
    }
  }
  return false;
}

function handleGetSeats(res, store) {
  send(res, 200, JSON.stringify({ seats: store.listSeats() }));
}

// Completes POST /reserve once the FULL body is in hand (SPEC §7: body read
// before the critical section). Runs SPEC §5 steps 2–8 in order.
function completeReserve(req, res, store, buf) {
  // Step 2: media type — only enforced when a body is actually present.
  if (buf.length > 0 && !isJsonContentType(req.headers['content-type'])) {
    return sendError(res, 'UNSUPPORTED_MEDIA_TYPE');
  }

  // Step 3: parse as a JSON object.
  const text = buf.toString('utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return sendError(res, 'INVALID_JSON');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return sendError(res, 'INVALID_JSON');
  }
  if (hasDuplicateKeys(text)) {
    return sendError(res, 'INVALID_JSON');
  }

  // Step 4: required fields present and not null.
  const seat_id = parsed.seat_id;
  const idempotency_key = parsed.idempotency_key;
  if (
    seat_id === undefined || seat_id === null ||
    idempotency_key === undefined || idempotency_key === null
  ) {
    return sendError(res, 'MISSING_FIELD');
  }

  // Step 5: field types/values.
  if (typeof seat_id !== 'string' || seat_id.length === 0) {
    return sendError(res, 'INVALID_FIELD');
  }
  if (
    typeof idempotency_key !== 'string' ||
    idempotency_key.length === 0 ||
    idempotency_key.length > MAX_KEY_LEN
  ) {
    return sendError(res, 'INVALID_FIELD');
  }

  // Steps 6–8 + idempotency: atomic in the store (the chokepoint).
  const result = store.reserve(seat_id, idempotency_key);
  switch (result.kind) {
    case 'created':
    case 'taken':
    case 'replay':
      return send(res, result.status, result.body);
    case 'reuse_conflict':
      return sendError(res, 'IDEMPOTENCY_KEY_REUSED');
    case 'seat_not_found':
      return sendError(res, 'SEAT_NOT_FOUND');
    default:
      return sendError(res, 'INTERNAL');
  }
}

function handleReserve(req, res, store) {
  let size = 0;
  const chunks = [];
  let settled = false;

  function bail(code) {
    if (settled) return;
    settled = true;
    sendError(res, code);
  }

  req.on('data', (chunk) => {
    if (settled) return;
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      // Step 1: size cap wins over everything else ([C-26], [C-61]).
      bail('PAYLOAD_TOO_LARGE');
      return; // keep draining; further chunks are ignored.
    }
    chunks.push(chunk);
  });

  req.on('error', () => {
    // Client aborted / transport error mid-read — a malformed request, never 500.
    if (settled) return;
    settled = true;
    try {
      sendError(res, 'INVALID_JSON');
    } catch {
      /* response may already be gone; nothing else to do */
    }
  });

  req.on('end', () => {
    if (settled) return;
    settled = true;
    completeReserve(req, res, store, Buffer.concat(chunks));
  });
}

function route(req, res, store) {
  const pathname = req.url.split('?')[0];
  const method = req.method;

  if (pathname === '/seats') {
    if (method === 'GET') {
      req.resume(); // drain any body
      return handleGetSeats(res, store);
    }
    req.resume();
    return sendError(res, 'METHOD_NOT_ALLOWED');
  }

  if (pathname === '/reserve') {
    if (method === 'POST') {
      return handleReserve(req, res, store);
    }
    req.resume();
    return sendError(res, 'METHOD_NOT_ALLOWED');
  }

  req.resume();
  return sendError(res, 'NOT_FOUND');
}

function createServer() {
  const store = createStore(); // fresh, in-memory state per server ([C-71])
  return http.createServer((req, res) => {
    // Top-level guard: any unexpected throw becomes 500 INTERNAL (SPEC §6).
    // Documented malformed input must never reach here.
    try {
      route(req, res, store);
    } catch {
      try {
        sendError(res, 'INTERNAL');
      } catch {
        /* headers may already be sent */
      }
    }
  });
}

function start() {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const server = createServer();
  server.listen(port, '127.0.0.1');
  return server;
}

if (require.main === module) {
  start();
}

module.exports = { createServer, start };
