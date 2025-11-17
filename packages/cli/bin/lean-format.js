#!/usr/bin/env node

// For development: use src directly
// For production: use dist after build
const path = require('path');
const fs = require('fs');

const distCliPath = path.join(__dirname, '../dist/index.js');
const srcCliPath = path.join(__dirname, '../src/index.js');

const cliModule = fs.existsSync(distCliPath)
  ? require(distCliPath)
  : require(srcCliPath);

if (typeof cliModule === 'function') {
  cliModule();
} else if (cliModule && typeof cliModule.main === 'function') {
  cliModule.main();
}
