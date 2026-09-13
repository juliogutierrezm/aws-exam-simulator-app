#!/usr/bin/env node
// scripts/sync-data.js
// Copies canonical data files to public/data/ for Angular runtime access.
'use strict';

const { readFileSync, mkdirSync, copyFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const FILES = ['questions.json', 'services.json', 'concepts.json', 'domains.json'];

mkdirSync(join(ROOT, 'public/data'), { recursive: true });

console.log('\n── Sync Data ─────────────────────────────────────────────────');
for (const file of FILES) {
  const src = join(ROOT, 'data', file);
  const dest = join(ROOT, 'public/data', file);
  if (file === 'questions.json') {
    const questions = JSON.parse(readFileSync(src, 'utf8'));
    const runtimeQuestions = questions.map((question) => ({
      schema_version: question.schema_version,
      id: question.id,
      exam_id: question.exam_id,
      bank_index: question.bank_index,
      exam_domain: question.exam_domain,
      select_count: question.select_count,
      generated_question: question.generated_question,
      generated_correct_answers: question.generated_correct_answers,
      feedback: question.feedback,
      metadata: question.metadata,
      references: question.references ?? [],
    }));
    writeFileSync(dest, `${JSON.stringify(runtimeQuestions)}\n`);
  } else {
    copyFileSync(src, dest);
  }
  const size = readFileSync(dest, 'utf8').length;
  console.log(`  ✓ ${file} → public/data/${file} (${(size / 1024).toFixed(1)} KB)`);
}
console.log('  Done.\n');
