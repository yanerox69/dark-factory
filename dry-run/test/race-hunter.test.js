'use strict';

// Cluster RH — race-hunter adversarial concurrency probes (SPEC §5 step 1, §7).
//
// These push past the happy-path concurrency suite. Each test is written so it
// would FAIL if the invariant it guards were reintroduced as a bug:
//   - If reserve()'s check-and-set gained an await/yield between read and write,
//     the torn/slow-body races below would produce two 201s (they assert one).
//   - If the 64 KiB `settled` flag desynced, the oversize tests would both 413
//     AND reserve the seat (they assert 413 with the seat still available).
//   - If key-reuse were resolved non-atomically, two seats could be reserved
//     under one key (they assert total reserved == 1).
//
// We drive raw sockets/chunked writes directly (helper.request sends the body in
// one shot, which cannot exercise interleaving or streaming size bails).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer } = require('../src/server');

async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`, port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function collect(res) {
  return new Promise((resolve) => {
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      const raw = Buffer.concat(chunks);
      resolve({ status: res.statusCode, raw, text: raw.toString('utf8') });
    });
  });
}

// Reserve POST whose body is delivered as caller-controlled chunks with a delay
// between each write. Yielding the event loop between chunks is exactly the
// window a broken (async) critical section would leak through.
function chunkedReserve(port, obj, { chunkSize = 1, delayMs = 1, headers = {} } = {}) {
  const body = Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj), 'utf8');
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/reserve',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': body.length, ...headers },
      },
      (res) => collect(res).then(resolve)
    );
    req.on('error', reject);
    let off = 0;
    const pump = () => {
      if (off >= body.length) return req.end();
      const end = Math.min(off + chunkSize, body.length);
      req.write(body.subarray(off, end));
      off = end;
      setTimeout(pump, delayMs);
    };
    pump();
  });
}

// Raw one-shot request (Content-Length may be spoofed / body may be oversized).
function raw(port, { method = 'POST', path = '/reserve', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, (res) =>
      collect(res).then(resolve)
    );
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

async function seatState(port, id) {
  const res = await raw(port, { method: 'GET', path: '/seats', headers: {} });
  return JSON.parse(res.text).seats.find((s) => s.seat_id === id).state;
}
async function reservedCount(port) {
  const res = await raw(port, { method: 'GET', path: '/seats', headers: {} });
  return JSON.parse(res.text).seats.filter((s) => s.state === 'reserved').length;
}

// ---------------------------------------------------------------------------
// 1. Torn/slow-body distinct-key race on ONE seat: interleaved byte streams.
//    Bodies arrive fully interleaved (A-byte, B-byte, ...). Each request only
//    hits the critical section on its own 'end'. Exactly one 201.
// ---------------------------------------------------------------------------
test('[RH-1] blocker: torn byte-by-byte bodies racing one seat -> exactly one 201', async () => {
  await withServer(async (_base, port) => {
    const N = 24;
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        chunkedReserve(port, { seat_id: 'A1', idempotency_key: `torn-${i}` }, { chunkSize: 1, delayMs: 1 })
      )
    );
    const created = results.filter((r) => r.status === 201);
    const taken = results.filter((r) => r.status === 409 && JSON.parse(r.text).error.code === 'SEAT_TAKEN');
    assert.equal(created.length, 1, 'exactly one 201 despite interleaved streaming');
    assert.equal(taken.length, N - 1, 'every loser is 409 SEAT_TAKEN, no 500, no silent success');
    assert.equal(await seatState(port, 'A1'), 'reserved');
    assert.equal(await reservedCount(port), 1, 'seat reserved exactly once');
  });
});

// ---------------------------------------------------------------------------
// 2. Interleaved streams across DIFFERENT seats: prove no cross-seat bleed and
//    order/independence hold under fully interleaved delivery.
// ---------------------------------------------------------------------------
test('[RH-2] high: interleaved torn bodies across many seats -> each reserved once', async () => {
  await withServer(async (_base, port) => {
    const seats = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
    const results = await Promise.all(
      seats.flatMap((seat, s) =>
        Array.from({ length: 6 }, (_, i) =>
          chunkedReserve(port, { seat_id: seat, idempotency_key: `${seat}-${i}` }, { chunkSize: 2, delayMs: 1 }).then(
            (r) => ({ seat, r })
          )
        )
      )
    );
    for (const seat of seats) {
      const forSeat = results.filter((x) => x.seat === seat).map((x) => x.r);
      assert.equal(forSeat.filter((r) => r.status === 201).length, 1, `${seat}: exactly one 201`);
      assert.equal(forSeat.filter((r) => r.status === 409).length, 5, `${seat}: rest 409`);
    }
    assert.equal(await reservedCount(port), 6, 'all six seats reserved exactly once, no bleed');
  });
});

// ---------------------------------------------------------------------------
// 3. 64 KiB streaming bail must NOT desync `settled`: a valid reserve prefix
//    followed by padding that trips the cap must yield 413 AND leave the seat
//    available (completeReserve must never run after bail).
// ---------------------------------------------------------------------------
test('[RH-3] blocker: oversize body with valid reserve prefix -> 413 only, seat NOT reserved', async () => {
  await withServer(async (_base, port) => {
    const prefix = JSON.stringify({ seat_id: 'B1', idempotency_key: 'oversize-prefix' });
    // valid JSON prefix + whitespace padding pushing total over 65536.
    const body = Buffer.concat([Buffer.from(prefix, 'utf8'), Buffer.alloc(70000, 0x20)]);
    const res = await raw(port, { headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }, body });
    assert.equal(res.status, 413, 'size cap wins');
    assert.equal(JSON.parse(res.text).error.code, 'PAYLOAD_TOO_LARGE');
    assert.equal(await seatState(port, 'B1'), 'available', 'buffered valid prefix must NOT be reserved after bail');
    assert.equal(await reservedCount(port), 0);
  });
});

// ---------------------------------------------------------------------------
// 3b. Same, but streamed slowly so the bail fires MID-STREAM while more chunks
//     are still arriving — then 'end' fires. Must see exactly one 413, no crash,
//     no double response, seat untouched, server still serving afterward.
// ---------------------------------------------------------------------------
test('[RH-3b] blocker: slow oversize stream -> single 413, no double-send, server survives', async () => {
  await withServer(async (_base, port) => {
    const res = await new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: '127.0.0.1', port, path: '/reserve', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        (r) => collect(r).then(resolve)
      );
      req.on('error', reject);
      let sent = 0;
      const prefix = JSON.stringify({ seat_id: 'B2', idempotency_key: 'slow-oversize' });
      req.write(prefix);
      sent += prefix.length;
      const pump = () => {
        if (sent >= 80000) return req.end();
        req.write(Buffer.alloc(8000, 0x20));
        sent += 8000;
        setTimeout(pump, 1);
      };
      pump();
    });
    assert.equal(res.status, 413, 'exactly one 413 from the mid-stream bail');
    assert.equal(JSON.parse(res.text).error.code, 'PAYLOAD_TOO_LARGE');
    assert.equal(await seatState(port, 'B2'), 'available', 'no reservation slipped through');
    // server still alive & correct:
    const ok = await raw(port, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_id: 'B2', idempotency_key: 'after-bail' }) });
    assert.equal(ok.status, 201, 'server healthy after a mid-stream bail');
  });
});

// ---------------------------------------------------------------------------
// 4. Size boundary: body exactly 65536 bytes is allowed; 65537 is rejected.
//    (>, not >=, per the read of handleReserve.)
// ---------------------------------------------------------------------------
test('[RH-4] high: body exactly at 64 KiB reserves; one byte over is 413', async () => {
  await withServer(async (_base, port) => {
    const mk = (seat, key, total) => {
      const core = JSON.stringify({ seat_id: seat, idempotency_key: key });
      const pad = total - Buffer.byteLength(core, 'utf8');
      return Buffer.concat([Buffer.from(core, 'utf8'), Buffer.alloc(pad, 0x20)]); // trailing WS = valid JSON
    };
    const atLimit = mk('A2', 'at-limit', 65536);
    const rAt = await raw(port, { headers: { 'Content-Type': 'application/json', 'Content-Length': atLimit.length }, body: atLimit });
    assert.equal(rAt.status, 201, 'exactly 65536 bytes is accepted (cap is >, not >=)');
    assert.equal(await seatState(port, 'A2'), 'reserved');

    const overLimit = mk('A3', 'over-limit', 65537);
    const rOver = await raw(port, { headers: { 'Content-Type': 'application/json', 'Content-Length': overLimit.length }, body: overLimit });
    assert.equal(rOver.status, 413, 'one byte over the cap is rejected');
    assert.equal(await seatState(port, 'A3'), 'available', 'over-limit request reserved nothing');
  });
});

// ---------------------------------------------------------------------------
// 5. Key-reuse race: ONE key, half the requests target seat X, half seat Y,
//    all concurrent. The atomic short-circuit must record exactly one seat.
//    The winner's same-seat siblings replay byte-identically; the other seat's
//    requests get 409 IDEMPOTENCY_KEY_REUSED. Total reserved across X,Y == 1.
// ---------------------------------------------------------------------------
test('[RH-5] blocker: one key racing two seats -> exactly one seat reserved, no double-book', async () => {
  await withServer(async (_base, port) => {
    const N = 60;
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        chunkedReserve(port, { seat_id: i % 2 === 0 ? 'A1' : 'B3', idempotency_key: 'shared-key' }, { chunkSize: 4, delayMs: 1 }).then(
          (r) => ({ seat: i % 2 === 0 ? 'A1' : 'B3', r })
        )
      )
    );
    const a1Reserved = (await seatState(port, 'A1')) === 'reserved';
    const b3Reserved = (await seatState(port, 'B3')) === 'reserved';
    assert.equal(await reservedCount(port), 1, 'exactly one seat reserved under the shared key');
    assert.ok(a1Reserved !== b3Reserved, 'exactly one of the two seats won, never both');

    const winner = a1Reserved ? 'A1' : 'B3';
    const winnerReqs = results.filter((x) => x.seat === winner).map((x) => x.r);
    const loserReqs = results.filter((x) => x.seat !== winner).map((x) => x.r);

    // The work happened exactly once (reservedCount==1 above). Under one key,
    // every winner-seat response is the SAME stored 201 — 1 'created' plus N-1
    // byte-identical replays. They must be indistinguishable to the client.
    const winnerBody = winnerReqs[0].raw;
    for (const r of winnerReqs) {
      assert.equal(r.status, 201, 'every winner-seat response is 201 (created or replay)');
      assert.ok(r.raw.equals(winnerBody), 'winner-seat responses are byte-identical — no created/replay divergence');
    }
    assert.equal(JSON.parse(winnerBody.toString('utf8')).seat_id, winner);

    // Every loser-seat request reused the key for a different seat => documented
    // reuse conflict. Never SEAT_TAKEN, never a silent success, never 500.
    for (const r of loserReqs) {
      assert.equal(r.status, 409, 'different-seat reuse is 409');
      assert.equal(JSON.parse(r.text).error.code, 'IDEMPOTENCY_KEY_REUSED', 'documented reuse code, not SEAT_TAKEN, not 500');
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Mid-body abort (transport error): client kills the socket after a partial
//    body. Must reserve nothing, must not crash the server, and the seat stays
//    available for a subsequent legitimate request.
// ---------------------------------------------------------------------------
test('[RH-6] high: client abort mid-body reserves nothing and leaves server healthy', async () => {
  await withServer(async (_base, port) => {
    await new Promise((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/reserve',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': 200 }, // promise more than we send
      });
      req.on('error', () => {}); // abort surfaces as a client-side error; ignore
      req.write('{"seat_id":"A2","idempo'); // partial, never completed
      setTimeout(() => {
        req.destroy();
        setTimeout(resolve, 20);
      }, 5);
    });
    assert.equal(await seatState(port, 'A2'), 'available', 'aborted request reserved nothing');
    const ok = await raw(port, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_id: 'A2', idempotency_key: 'post-abort' }) });
    assert.equal(ok.status, 201, 'server still healthy and seat still reservable after an abort');
  });
});

// ---------------------------------------------------------------------------
// 7. Sequential replay after a concurrent burst: the stored response for a key
//    must remain byte-identical when replayed long after the race settled.
// ---------------------------------------------------------------------------
test('[RH-7] medium: post-race sequential replay is byte-identical to the stored response', async () => {
  await withServer(async (_base, port) => {
    const key = 'replay-key';
    const burst = await Promise.all(
      Array.from({ length: 30 }, () =>
        chunkedReserve(port, { seat_id: 'B1', idempotency_key: key }, { chunkSize: 3, delayMs: 1 })
      )
    );
    const stored = burst.find((r) => r.status === 201) || burst[0];
    // all burst responses already identical (same key) — now replay sequentially:
    const later = await raw(port, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_id: 'B1', idempotency_key: key }) });
    assert.equal(later.status, stored.status, 'replay status matches stored');
    assert.ok(later.raw.equals(stored.raw), 'replay body byte-identical to stored');
    assert.equal(await reservedCount(port), 1, 'replays performed no additional work');
  });
});

// Oversized reserve body (> 64 KiB) delivered in one shot — trips the size cap.
function oversizeReserve(port, seat, key) {
  const core = JSON.stringify({ seat_id: seat, idempotency_key: key });
  const body = Buffer.concat([Buffer.from(core, 'utf8'), Buffer.alloc(70000, 0x20)]);
  return raw(port, {
    headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
    body,
  });
}

// ---------------------------------------------------------------------------
// 8. RECORD-vs-REPLAY window (architect's specific ask): many same-key,
//    same-seat requests arriving before the first records. The idempotency
//    short-circuit (records.get, store.js:54) and the record write
//    (records.set, store.js:75) sit in the same synchronous section, so a
//    sibling can never observe a reserved seat WITHOUT also seeing the record.
//    If that window opened (async), a sibling would skip replay and return
//    409 SEAT_TAKEN under the SAME key -> a 201+409 split. We assert zero 409s
//    and byte-identical responses, which is exactly that bug's signature.
// ---------------------------------------------------------------------------
test('[RH-8] blocker: record/replay window — same key+seat storm never splits 201/409', async () => {
  await withServer(async (_base, port) => {
    const N = 40;
    // chunkSize spanning the whole body so every request completes on nearly the
    // same tick — maximizes the chance a broken store interleaves record/replay.
    const results = await Promise.all(
      Array.from({ length: N }, () =>
        chunkedReserve(port, { seat_id: 'A1', idempotency_key: 'rr-window' }, { chunkSize: 64, delayMs: 1 })
      )
    );
    const first = results[0];
    for (const r of results) {
      assert.equal(r.status, first.status, 'no status divergence under one key');
      assert.ok(r.raw.equals(first.raw), 'every same-key response byte-identical');
    }
    assert.equal(first.status, 201, 'the single stored response is the created 201');
    assert.equal(results.filter((r) => r.status === 409).length, 0, 'NO 409 SEAT_TAKEN under the recording key — no record/replay race');
    assert.equal(await reservedCount(port), 1, 'work done exactly once');
  });
});

// ---------------------------------------------------------------------------
// 9. Mixed distinct/same-key storm on ONE seat. Whoever reserves the seat first
//    wins; the rest must be coherent. Key property: the shared-key group must
//    present ONE identical response (a 201 if it won, else a recorded 409
//    SEAT_TAKEN replayed identically) — never a 201+409 split across siblings.
//    Distinct-key losers are 409 SEAT_TAKEN. Seat reserved exactly once.
// ---------------------------------------------------------------------------
test('[RH-9] blocker: mixed distinct/same-key storm on one seat — shared key stays coherent', async () => {
  await withServer(async (_base, port) => {
    const M = 20; // shared-key group
    const D = 20; // distinct-key group
    const tagged = await Promise.all([
      ...Array.from({ length: M }, () =>
        chunkedReserve(port, { seat_id: 'B2', idempotency_key: 'mix-shared' }, { chunkSize: 5, delayMs: 1 }).then((r) => ({ g: 'shared', r }))
      ),
      ...Array.from({ length: D }, (_, i) =>
        chunkedReserve(port, { seat_id: 'B2', idempotency_key: `mix-distinct-${i}` }, { chunkSize: 5, delayMs: 1 }).then((r) => ({ g: 'distinct', r }))
      ),
    ]);
    assert.equal(await reservedCount(port), 1, 'seat reserved exactly once across the mixed storm');
    assert.equal(await seatState(port, 'B2'), 'reserved');

    const shared = tagged.filter((x) => x.g === 'shared').map((x) => x.r);
    const sFirst = shared[0];
    for (const r of shared) {
      assert.equal(r.status, sFirst.status, 'shared key: single status, no 201/409 split');
      assert.ok(r.raw.equals(sFirst.raw), 'shared key: byte-identical siblings');
    }
    assert.ok(sFirst.status === 201 || sFirst.status === 409, 'shared key resolves to exactly one documented outcome');
    if (sFirst.status === 409) {
      assert.equal(JSON.parse(sFirst.text).error.code, 'SEAT_TAKEN', 'shared key lost the seat -> recorded SEAT_TAKEN, replayed identically');
    }

    const distinct = tagged.filter((x) => x.g === 'distinct').map((x) => x.r);
    const created201 = tagged.filter((x) => x.r.status === 201).length > 0;
    assert.ok(created201, 'exactly one party created the reservation');
    for (const r of distinct) {
      assert.ok(r.status === 201 || r.status === 409, 'no 500 anywhere in the storm');
      if (r.status === 409) assert.equal(JSON.parse(r.text).error.code, 'SEAT_TAKEN', 'distinct-key loser is SEAT_TAKEN');
    }
    // Exactly one 201-created effect total (proven by reservedCount==1 too).
    // Distinct 201s can be at most one (only the seat winner if it was distinct).
    assert.ok(distinct.filter((r) => r.status === 201).length <= 1, 'at most one distinct-key 201');
  });
});

// ---------------------------------------------------------------------------
// 10. Seat-exhaustion race: hammer ALL 6 seats concurrently with distinct keys.
//     Reservations must be CONSERVED — exactly 6 created, one per seat, none
//     double-booked. After exhaustion every further attempt is 409 SEAT_TAKEN,
//     never 500, and no seat is available.
// ---------------------------------------------------------------------------
test('[RH-10] blocker: seat-exhaustion race conserves reservations (exactly 6, no double-book)', async () => {
  await withServer(async (_base, port) => {
    const seats = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
    const perSeat = 20;
    const results = await Promise.all(
      seats.flatMap((seat) =>
        Array.from({ length: perSeat }, (_, i) =>
          chunkedReserve(port, { seat_id: seat, idempotency_key: `exh-${seat}-${i}` }, { chunkSize: 8, delayMs: 1 }).then((r) => ({ seat, r }))
        )
      )
    );
    const created = results.filter((x) => x.r.status === 201);
    assert.equal(created.length, seats.length, 'exactly one 201 per seat — reservations conserved, none created twice');
    // one winner per seat
    const winnersBySeat = new Set(created.map((x) => x.seat));
    assert.equal(winnersBySeat.size, seats.length, 'every seat won exactly once (no seat double-booked, none missed)');
    for (const { r } of results) {
      assert.ok(r.status === 201 || (r.status === 409 && JSON.parse(r.text).error.code === 'SEAT_TAKEN'), 'only 201 or 409 SEAT_TAKEN, zero 500s');
    }
    const seatsBody = JSON.parse((await raw(port, { method: 'GET', path: '/seats', headers: {} })).text);
    assert.equal(seatsBody.seats.filter((s) => s.state === 'reserved').length, 6, 'all six reserved');
    assert.ok(seatsBody.seats.every((s) => s.state === 'reserved'), 'no seat left available after exhaustion');
    // Post-exhaustion attempt is a clean documented 409, not a 500.
    const after = await raw(port, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_id: 'A1', idempotency_key: 'post-exhaustion' }) });
    assert.equal(after.status, 409);
    assert.equal(JSON.parse(after.text).error.code, 'SEAT_TAKEN');
  });
});

// ---------------------------------------------------------------------------
// 11. Oversized-body + concurrency on ONE seat. A storm of oversized bodies
//     racing valid reservations for the same seat: every oversized request is
//     413 and reserves nothing; exactly one valid request wins (201); the rest
//     of the valid ones are 409 SEAT_TAKEN. No 500, no oversized-driven booking.
// ---------------------------------------------------------------------------
test('[RH-11] high: oversized-body storm racing valid reserves — 413s book nothing, one winner', async () => {
  await withServer(async (_base, port) => {
    const big = 15;
    const good = 15;
    const results = await Promise.all([
      ...Array.from({ length: big }, (_, i) => oversizeReserve(port, 'B3', `big-${i}`).then((r) => ({ kind: 'big', r }))),
      ...Array.from({ length: good }, (_, i) =>
        chunkedReserve(port, { seat_id: 'B3', idempotency_key: `good-${i}` }, { chunkSize: 6, delayMs: 1 }).then((r) => ({ kind: 'good', r }))
      ),
    ]);
    const bigs = results.filter((x) => x.kind === 'big').map((x) => x.r);
    const goods = results.filter((x) => x.kind === 'good').map((x) => x.r);
    for (const r of bigs) {
      assert.equal(r.status, 413, 'every oversized request rejected with 413');
      assert.equal(JSON.parse(r.text).error.code, 'PAYLOAD_TOO_LARGE');
    }
    assert.equal(goods.filter((r) => r.status === 201).length, 1, 'exactly one valid request won');
    assert.equal(goods.filter((r) => r.status === 409 && JSON.parse(r.text).error.code === 'SEAT_TAKEN').length, good - 1, 'other valid requests 409 SEAT_TAKEN');
    assert.equal(await reservedCount(port), 1, 'exactly one reservation — no oversized request booked a seat');
    assert.equal(await seatState(port, 'B3'), 'reserved');
  });
});
