'use strict';

const fs = require('node:fs');
const path = require('node:path');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const outDir = path.join('dist');
fs.mkdirSync(outDir, { recursive: true });

const artifact = {
  name: pkg.name,
  version: pkg.version,
  buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
  commit: process.env.GITHUB_SHA || 'local',
  node: process.version,
  builtAt: new Date().toISOString()
};

fs.writeFileSync(path.join(outDir, 'build-info.json'), JSON.stringify(artifact, null, 2));
console.log('Build artifact written to dist/build-info.json');
console.log(JSON.stringify(artifact, null, 2));
