#!/usr/bin/env node
// scripts/audit-icons.js
// Recursively inspects resources/aws-icons/ and generates docs/audits/aws-svg-inventory.json
'use strict';

const { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } = require('fs');
const { join, relative, basename } = require('path');
const { createHash } = require('crypto');

const ROOT = join(__dirname, '..');
const ICONS_DIR = join(ROOT, 'resources/aws-icons');

function collectSVGs(dir, result = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSVGs(full, result);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) result.push(full);
  }
  return result;
}

function extractAttr(svg, attr) {
  const m = svg.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
  return m ? m[1] : null;
}

function isXmlValid(svg) {
  return /^\s*(<\?xml[^>]*>\s*)?(<svg\b)/i.test(svg) ||
         /^\s*<!DOCTYPE[^>]*>\s*(<svg\b)/i.test(svg);
}

const files = collectSVGs(ICONS_DIR);
const inventory = [];
const hashMap = {};
const duplicates = [];
const invalidXml = [];
const withScript = [];
const withExternalRefs = [];
const withRasterEmbeds = [];
const missingViewBox = [];

for (const absPath of files) {
  const relPath = relative(ICONS_DIR, absPath).replace(/\\/g, '/');
  const parts = relPath.split('/');
  const category = parts.length > 1 ? parts[0] : '';
  const filename = basename(absPath);

  let raw = '';
  let filesize = 0;
  let parseError = null;

  try {
    raw = readFileSync(absPath, 'utf8');
    filesize = statSync(absPath).size;
  } catch (e) {
    parseError = e.message;
  }

  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 16);
  const viewBox = extractAttr(raw, 'viewBox');
  const width = extractAttr(raw, 'width');
  const height = extractAttr(raw, 'height');
  const xmlValid = raw ? isXmlValid(raw) : false;
  const hasScript = /<script\b/i.test(raw);
  // Only flag actual external resource references (not xmlns namespace declarations)
  const hasExternalRef = /(?:xlink:href|href)\s*=\s*["'](https?:\/\/|\/\/)/i.test(raw);
  const hasRaster = /data:image\/(png|jpe?g|gif|bmp|webp)/i.test(raw);

  const entry = {
    filename,
    relative_path: relPath,
    category,
    filesize,
    viewBox: viewBox ?? null,
    width: width ?? null,
    height: height ?? null,
    xml_valid: xmlValid,
    has_script: hasScript,
    has_external_ref: hasExternalRef,
    has_raster_embed: hasRaster,
    hash,
    issues: [],
  };

  if (!xmlValid) { entry.issues.push('invalid_xml'); invalidXml.push(relPath); }
  if (hasScript) { entry.issues.push('has_script'); withScript.push(relPath); }
  if (hasExternalRef) { entry.issues.push('has_external_ref'); withExternalRefs.push(relPath); }
  if (hasRaster) { entry.issues.push('has_raster_embed'); withRasterEmbeds.push(relPath); }
  if (!viewBox) { entry.issues.push('missing_viewBox'); missingViewBox.push(relPath); }
  if (parseError) entry.issues.push(`read_error: ${parseError}`);

  if (hashMap[hash]) {
    hashMap[hash].push(relPath);
  } else {
    hashMap[hash] = [relPath];
  }

  inventory.push(entry);
}

// Second pass: mark duplicates
for (const [hash, paths] of Object.entries(hashMap)) {
  if (paths.length > 1) {
    duplicates.push({ hash, files: paths });
    for (const entry of inventory) {
      if (entry.hash === hash && !entry.issues.includes('duplicate')) {
        entry.issues.push('duplicate');
      }
    }
  }
}

const report = {
  generated_at: new Date().toISOString(),
  total_svg_files: files.length,
  duplicate_svg_groups: duplicates.length,
  invalid_xml_files: invalidXml.length,
  files_with_script: withScript.length,
  files_with_external_ref: withExternalRefs.length,
  files_with_raster_embed: withRasterEmbeds.length,
  files_missing_viewbox: missingViewBox.length,
  duplicates,
  invalid_xml: invalidXml,
  with_script: withScript,
  with_external_ref: withExternalRefs,
  missing_viewbox: missingViewBox,
  inventory,
};

mkdirSync(join(ROOT, 'docs/audits'), { recursive: true });
writeFileSync(
  join(ROOT, 'docs/audits/aws-svg-inventory.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('\n── SVG Audit ─────────────────────────────────────────────────');
console.log(`  Total SVGs        : ${files.length}`);
console.log(`  Duplicate groups  : ${duplicates.length}`);
console.log(`  Invalid XML       : ${invalidXml.length}`);
console.log(`  With <script>     : ${withScript.length}`);
console.log(`  External refs     : ${withExternalRefs.length}`);
console.log(`  Raster embeds     : ${withRasterEmbeds.length}`);
console.log(`  Missing viewBox   : ${missingViewBox.length}`);
if (invalidXml.length) invalidXml.forEach(f => console.error('  ✗ invalid:', f));
if (withScript.length) withScript.forEach(f => console.warn('  ⚠ script:', f));
console.log('  Report → docs/audits/aws-svg-inventory.json\n');
