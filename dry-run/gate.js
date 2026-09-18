'use strict';

// Regression gate — the single definition of done (SPEC §10, CONFORMANCE C-73..C-75).
//
// Runs START-TO-FINISH with NO shell pipes. Each step is spawned with inherited
// stdio, so a step's real exit code is observed directly (never masked by a
// pipeline's last-command exit code, e.g. `... | tail`). The gate exits 0 ONLY
// if every step exited 0; the first failing step sets a non-zero exit and its
// name is printed.
//
// Steps:
//   1. Syntax  — `node --check` over every file under src/** and test/**  (C-73)
//   2. Tests   — `node --test` full suite, start-to-finish                (C-74)
//   3. Format  — N/A: zero runtime deps, no formatter/linter configured   (C-75)
//
// Usage: `npm run gate`  (or `node gate.js`) from dry-run/.

const { spawnSync } = require('node:child_process');
const { readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const ROOT = __dirname;

// Recursively collect *.js files under a directory (src/**, test/**).
function collectJs(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectJs(full));
    } else if (entry.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

// Run a command with inherited stdio (no pipe) and return its numeric exit code.
function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: false });
  if (r.error) {
    console.error(`  ! failed to spawn: ${r.error.message}`);
    return 1;
  }
  if (typeof r.status === 'number') return r.status;
  // Killed by signal, or no numeric status -> treat as failure.
  console.error(`  ! process ended without a numeric exit code (signal: ${r.signal})`);
  return 1;
}

let failedStep = null;

// --- Step 1: syntax sweep (C-73) ---
console.log('== Gate step 1/3: syntax (node --check over src/** and test/**) ==');
const files = [...collectJs(join(ROOT, 'src')), ...collectJs(join(ROOT, 'test'))].sort();
for (const f of files) {
  const code = run(process.execPath, ['--check', f]);
  const rel = relative(ROOT, f);
  if (code === 0) {
    console.log(`  ok  ${rel}`);
  } else {
    console.log(`  FAIL ${rel} (exit ${code})`);
    failedStep = failedStep || 'step 1 (syntax)';
  }
}
console.log(`   checked ${files.length} files`);

// --- Step 2: full test suite (C-74) ---
if (!failedStep) {
  console.log('\n== Gate step 2/3: tests (node --test, full suite) ==');
  const code = run(process.execPath, ['--test']);
  if (code !== 0) failedStep = `step 2 (tests, exit ${code})`;
} else {
  console.log('\n== Gate step 2/3: tests -- SKIPPED (step 1 already red) ==');
}

// --- Step 3: format (C-75) ---
console.log('\n== Gate step 3/3: format ==');
console.log('   N/A - zero runtime dependencies, no formatter/linter configured (C-75).');

// --- Verdict ---
if (failedStep) {
  console.log(`\nGATE RED -- failing step: ${failedStep}`);
  process.exit(1);
}
console.log('\nGATE GREEN -- syntax + tests passed, format N/A.');
process.exit(0);
