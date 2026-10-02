'use strict';

const fs = require('node:fs');
const path = require('node:path');

const problems = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) check(full);
  }
}

function check(file) {
  if (file.endsWith('lint.js')) return;
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/\s+$/.test(line)) problems.push(`${file}:${i + 1} trailing whitespace`);
    if (/\bdebugger\b/.test(line)) problems.push(`${file}:${i + 1} debugger statement`);
    if (/\bvar\s+\w/.test(line)) problems.push(`${file}:${i + 1} use let/const instead of var`);
  });
}

for (const root of ['server', 'scripts']) {
  if (fs.existsSync(root)) walk(root);
}

if (problems.length) {
  console.error('Lint failed:');
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log('Lint passed');
