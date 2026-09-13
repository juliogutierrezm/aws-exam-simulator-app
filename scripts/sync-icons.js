#!/usr/bin/env node
// scripts/sync-icons.js
// Reads public/data/aws-icon-manifest.json and copies only required SVGs
// from resources/aws-icons/ to public/aws-icons/ preserving category subdirs.
'use strict';

const { readFileSync, mkdirSync, copyFileSync, existsSync } = require('fs');
const { join, dirname } = require('path');

const ROOT = join(__dirname, '..');
const ICONS_SRC = join(ROOT, 'resources/aws-icons');
const ICONS_DEST = join(ROOT, 'public/aws-icons');
const MANIFEST_PATH = join(ROOT, 'public/data/aws-icon-manifest.json');

if (!existsSync(MANIFEST_PATH)) {
  console.error('  ✗ Runtime manifest not found. Run "npm run build:manifest" first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const uniqueFiles = [...new Set(Object.values(manifest).map(v => v.file))];

mkdirSync(ICONS_DEST, { recursive: true });

console.log('\n── Sync Icons ────────────────────────────────────────────────');

let copied = 0;
const missing = [];

for (const relFile of uniqueFiles) {
  const src = join(ICONS_SRC, relFile);
  const dest = join(ICONS_DEST, relFile);

  if (!existsSync(src)) {
    missing.push(relFile);
    console.warn(`  ⚠ source not found: ${relFile}`);
    continue;
  }

  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  copied++;
}

console.log(`  Copied  : ${copied} SVGs`);
if (missing.length) {
  console.warn(`  Missing : ${missing.length}`);
  missing.forEach(f => console.warn(`    ⚠ ${f}`));
}
console.log(`  Output  : public/aws-icons/\n`);

if (missing.length > 0) process.exit(1);
