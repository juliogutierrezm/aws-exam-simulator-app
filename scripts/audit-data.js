#!/usr/bin/env node
// scripts/audit-data.js
// Validates the canonical dataset files and generates docs/audits/dataset-validation-summary.json
'use strict';

const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');

function readJSON(relPath) {
  const abs = join(ROOT, relPath);
  try {
    const raw = readFileSync(abs, 'utf8');
    return { ok: true, data: JSON.parse(raw), error: null };
  } catch (e) {
    return { ok: false, data: null, error: e.message };
  }
}

const errors = [];
const warnings = [];
const info = [];

// ── questions.json ────────────────────────────────────────────────────────────
const qResult = readJSON('data/questions.json');
let questionsValid = qResult.ok;
let questions = qResult.data ?? [];

if (!qResult.ok) {
  errors.push(`questions.json: invalid JSON — ${qResult.error}`);
} else {
  info.push(`questions.json: valid JSON`);

  const total = questions.length;
  if (total !== 520) {
    errors.push(`questions.json: expected 520 questions, found ${total}`);
  } else {
    info.push(`questions.json: 520 questions ✓`);
  }

  const ids = questions.map(q => q.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    errors.push(`questions.json: duplicate IDs found: ${[...new Set(dupes)].join(', ')}`);
  } else {
    info.push(`questions.json: all IDs unique ✓`);
  }

  const bankIndices = questions.map(q => q.bank_index).sort((a, b) => a - b);
  const expectedIndices = Array.from({ length: 520 }, (_, i) => i + 1);
  const missingIndices = expectedIndices.filter(i => !bankIndices.includes(i));
  const extraIndices = bankIndices.filter(i => !expectedIndices.includes(i));
  const dupeBankIndices = bankIndices.filter((v, i, a) => a.indexOf(v) !== i);

  if (missingIndices.length > 0) errors.push(`questions.json: missing bank_index: ${missingIndices.join(', ')}`);
  if (extraIndices.length > 0) errors.push(`questions.json: unexpected bank_index: ${extraIndices.join(', ')}`);
  if (dupeBankIndices.length > 0) errors.push(`questions.json: duplicate bank_index: ${[...new Set(dupeBankIndices)].join(', ')}`);
  if (missingIndices.length === 0 && extraIndices.length === 0 && dupeBankIndices.length === 0) {
    info.push(`questions.json: bank_index 1–520 continuous and unique ✓`);
  }

  const examGroups = {};
  for (const q of questions) {
    if (!q.exam_id) { errors.push(`questions.json: question id=${q.id} missing exam_id`); continue; }
    examGroups[q.exam_id] = (examGroups[q.exam_id] || 0) + 1;
  }
  const examCounts = Object.entries(examGroups);
  const badExams = examCounts.filter(([, c]) => c !== 65);
  if (badExams.length > 0) {
    badExams.forEach(([exam, count]) =>
      errors.push(`questions.json: exam ${exam} has ${count} questions (expected 65)`)
    );
  } else {
    info.push(`questions.json: all ${examCounts.length} exams have exactly 65 questions ✓`);
  }

  // select_count consistency — dataset v2.3 stores answers in source_correct_answers
  let selectCountErrors = 0;
  let missingAnswersCount = 0;
  for (const q of questions) {
    if (q.select_count == null) {
      errors.push(`questions.json: question id=${q.id} missing select_count`);
      selectCountErrors++;
      continue;
    }
    const answers = q.source_correct_answers ?? q.generated_correct_answers ?? q.answers;
    if (!answers) {
      missingAnswersCount++;
      continue;
    }
    const correctAnswers = Array.isArray(answers) ? answers : [];
    if (correctAnswers.length !== q.select_count) {
      selectCountErrors++;
      errors.push(`questions.json: question id=${q.id} select_count=${q.select_count} but answers has ${correctAnswers.length} items`);
    }
  }
  if (selectCountErrors === 0 && missingAnswersCount === 0) {
    info.push(`questions.json: all select_count values consistent with answers ✓`);
  } else if (missingAnswersCount > 0) {
    warnings.push(`questions.json: ${missingAnswersCount} questions have no answers field`);
  }

  const requiredFields = ['id', 'exam_id', 'bank_index', 'exam_domain', 'select_count'];
  let missingFieldCount = 0;
  for (const q of questions) {
    for (const f of requiredFields) {
      if (q[f] == null) {
        errors.push(`questions.json: question id=${q.id ?? '?'} missing field '${f}'`);
        missingFieldCount++;
      }
    }
  }
  if (missingFieldCount === 0) {
    info.push(`questions.json: all required fields present ✓`);
  }
}

// ── services.json ─────────────────────────────────────────────────────────────
const sResult = readJSON('data/services.json');
if (!sResult.ok) {
  errors.push(`services.json: invalid JSON — ${sResult.error}`);
} else {
  info.push(`services.json: valid JSON, ${sResult.data.length} services ✓`);
  const svcIds = sResult.data.map(s => s.id);
  const uniqueSvcIds = new Set(svcIds);
  if (uniqueSvcIds.size !== svcIds.length) {
    const dupes = svcIds.filter((id, i) => svcIds.indexOf(id) !== i);
    errors.push(`services.json: duplicate IDs: ${[...new Set(dupes)].join(', ')}`);
  } else {
    info.push(`services.json: all IDs unique ✓`);
  }
  for (const s of sResult.data) {
    if (!s.icon_key) errors.push(`services.json: service id=${s.id} missing icon_key`);
    if (!s.category) warnings.push(`services.json: service id=${s.id} missing category`);
  }
  const iconKeys = [...new Set(sResult.data.map(s => s.icon_key).filter(Boolean))];
  info.push(`services.json: ${iconKeys.length} unique icon_keys`);
}

// ── concepts.json ─────────────────────────────────────────────────────────────
const cResult = readJSON('data/concepts.json');
if (!cResult.ok) {
  errors.push(`concepts.json: invalid JSON — ${cResult.error}`);
} else {
  info.push(`concepts.json: valid JSON, ${cResult.data.length} concepts ✓`);
}

// ── domains.json ──────────────────────────────────────────────────────────────
const dResult = readJSON('data/domains.json');
if (!dResult.ok) {
  errors.push(`domains.json: invalid JSON — ${dResult.error}`);
} else {
  info.push(`domains.json: valid JSON, ${dResult.data.length} domains ✓`);
  const domainIds = dResult.data.map(d => d.id);
  if (questionsValid) {
    const usedDomains = [...new Set(questions.map(q => q.exam_domain).filter(Boolean))];
    const unknownDomains = usedDomains.filter(d => !domainIds.includes(d));
    if (unknownDomains.length > 0) {
      errors.push(`questions.json: unknown exam_domain values: ${unknownDomains.join(', ')}`);
    } else {
      info.push(`questions.json: all exam_domain values reference known domains ✓`);
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
const passed = errors.length === 0;
const summary = {
  generated_at: new Date().toISOString(),
  passed,
  total_questions: questions.length,
  total_errors: errors.length,
  total_warnings: warnings.length,
  errors,
  warnings,
  info,
};

mkdirSync(join(ROOT, 'docs/audits'), { recursive: true });
writeFileSync(
  join(ROOT, 'docs/audits/dataset-validation-summary.json'),
  JSON.stringify(summary, null, 2),
  'utf8'
);

console.log('\n── Dataset Audit ────────────────────────────────────────────');
info.forEach(m => console.log('  ✓', m));
if (warnings.length) warnings.forEach(m => console.warn('  ⚠', m));
if (errors.length) errors.forEach(m => console.error('  ✗', m));
console.log(`\n  Result: ${passed ? '✅ PASSED' : '❌ FAILED'} (${errors.length} errors, ${warnings.length} warnings)`);
console.log('  Report → docs/audits/dataset-validation-summary.json\n');

if (!passed) process.exit(1);
