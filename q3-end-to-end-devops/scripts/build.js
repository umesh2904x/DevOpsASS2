'use strict';

const fs = require('node:fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
fs.mkdirSync('dist', { recursive: true });

const info = {
  name: pkg.name,
  version: pkg.version,
  commit: process.env.GITHUB_SHA || 'local',
  buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
  builtAt: new Date().toISOString()
};

fs.writeFileSync('dist/build-info.json', JSON.stringify(info, null, 2));
console.log('build-info.json written');
console.log(JSON.stringify(info, null, 2));
