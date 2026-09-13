#!/usr/bin/env node
// scripts/build-manifest.js
// Maps each icon_key from services.json to a SVG in resources/aws-icons/
// Generates: docs/audits/aws-icon-manifest.json, public/data/aws-icon-manifest.json,
//            docs/audits/aws-icon-audit-report.json
'use strict';

const { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } = require('fs');
const { join, relative, basename } = require('path');

const ROOT = join(__dirname, '..');
const ICONS_DIR = join(ROOT, 'resources/aws-icons');

function readJSON(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function collectSVGs(dir, result = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSVGs(full, result);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) result.push(full);
  }
  return result;
}

function slugify(str) {
  return str.toLowerCase().replace(/\.svg$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function stripPrefix(slug) {
  return slug.replace(/^(amazon|aws)-/, '');
}

const services = readJSON('data/services.json');
const allSvgPaths = collectSVGs(ICONS_DIR);

const slugToFiles = {};
for (const abs of allSvgPaths) {
  const rel = relative(ICONS_DIR, abs).replace(/\\/g, '/');
  const fileSlug = slugify(basename(rel));
  const bare = stripPrefix(fileSlug);
  for (const key of [fileSlug, bare]) {
    if (!slugToFiles[key]) slugToFiles[key] = [];
    slugToFiles[key].push(rel);
  }
}

// ── Manual alias table ─────────────────────────────────────────────────────────
// Verified against actual directory listing of resources/aws-icons/
const MANUAL_ALIASES = {
  // Storage
  'amazon-s3':                  'Storage/Amazon-Simple-Storage-Service.svg',
  'amazon-ebs':                 'Storage/Amazon-Elastic-Block-Store.svg',
  'amazon-efs':                 'Storage/Amazon-EFS.svg',
  'amazon-fsx':                 'Storage/Amazon-FSx.svg',
  'aws-storage-gateway':        'Storage/AWS-Storage-Gateway.svg',
  'aws-backup':                 'Storage/AWS-Backup.svg',
  'aws-snow-family':            'Storage/AWS-Snowball.svg',
  // Compute
  'amazon-ec2':                 'Compute/Amazon-EC2.svg',
  'amazon-ec2-auto-scaling':    'Compute/Amazon-EC2-Auto-Scaling.svg',
  'aws-lambda':                 'Compute/AWS-Lambda.svg',
  'aws-fargate':                'Containers/AWS-Fargate.svg',
  'aws-elastic-beanstalk':      'Compute/AWS-Elastic-Beanstalk.svg',
  // Containers
  'amazon-ecs':                 'Containers/Amazon-Elastic-Container-Service.svg',
  'amazon-eks':                 'Containers/Amazon-Elastic-Kubernetes-Service.svg',
  // Database
  'amazon-rds':                 'Databases/Amazon-RDS.svg',
  'amazon-aurora':              'Databases/Amazon-Aurora.svg',
  'amazon-dynamodb':            'Databases/Amazon-DynamoDB.svg',
  'amazon-elasticache':         'Databases/Amazon-ElastiCache.svg',
  'amazon-neptune':             'Databases/Amazon-Neptune.svg',
  'amazon-documentdb':          'Databases/Amazon-DocumentDB.svg',
  'amazon-redshift':            'Analytics/Amazon-Redshift.svg',
  // Networking
  'amazon-vpc':                 'Networking-Content-Delivery/Amazon-Virtual-Private-Cloud.svg',
  'amazon-cloudfront':          'Networking-Content-Delivery/Amazon-CloudFront.svg',
  'amazon-route-53':            'Networking-Content-Delivery/Amazon-Route-53.svg',
  'elastic-load-balancing':     'Networking-Content-Delivery/Elastic-Load-Balancing.svg',
  'aws-direct-connect':         'Networking-Content-Delivery/AWS-Direct-Connect.svg',
  'aws-global-accelerator':     'Networking-Content-Delivery/AWS-Global-Accelerator.svg',
  'aws-transit-gateway':        'Networking-Content-Delivery/AWS-Transit-Gateway.svg',
  'amazon-api-gateway':         'Networking-Content-Delivery/Amazon-API-Gateway.svg',
  // Application Integration
  'amazon-sqs':                 'Application-Integration/Amazon-Simple-Queue-Service.svg',
  'amazon-sns':                 'Application-Integration/Amazon-Simple-Notification-Service.svg',
  'amazon-eventbridge':         'Application-Integration/Amazon-EventBridge.svg',
  'amazon-mq':                  'Application-Integration/Amazon-MQ.svg',
  'aws-step-functions':         'Application-Integration/AWS-Step-Functions.svg',
  // Analytics
  'amazon-kinesis':             'Analytics/Amazon-Kinesis.svg',
  'amazon-athena':              'Analytics/Amazon-Athena.svg',
  'amazon-emr':                 'Analytics/Amazon-EMR.svg',
  // 'amazon-quicksight' — not present in SVG pack
  'aws-glue':                   'Analytics/AWS-Glue.svg',
  'aws-lake-formation':         'Analytics/AWS-Lake-Formation.svg',
  // Security, Identity
  'aws-iam':                    'Security-Identity/AWS-Identity-and-Access-Management.svg',
  'aws-kms':                    'Security-Identity/AWS-Key-Management-Service.svg',
  'aws-waf':                    'Security-Identity/AWS-WAF.svg',
  'aws-shield':                 'Security-Identity/AWS-Shield.svg',
  'amazon-guardduty':           'Security-Identity/Amazon-GuardDuty.svg',
  'amazon-cognito':             'Security-Identity/Amazon-Cognito.svg',
  'amazon-inspector':           'Security-Identity/Amazon-Inspector.svg',
  'amazon-macie':               'Security-Identity/Amazon-Macie.svg',
  'aws-secrets-manager':        'Security-Identity/AWS-Secrets-Manager.svg',
  'aws-certificate-manager':    'Security-Identity/AWS-Certificate-Manager.svg',
  'aws-directory-service':      'Security-Identity/AWS-Directory-Service.svg',
  // Management
  'amazon-cloudwatch':          'Management-Tools/Amazon-CloudWatch.svg',
  'amazon-cloudtrail':          'Management-Tools/AWS-CloudTrail.svg',
  'aws-cloudformation':         'Management-Tools/AWS-CloudFormation.svg',
  'aws-config':                 'Management-Tools/AWS-Config.svg',
  'aws-organizations':          'Management-Tools/AWS-Organizations.svg',
  'aws-systems-manager':        'Management-Tools/AWS-Systems-Manager.svg',
  'aws-trusted-advisor':        'Management-Tools/AWS-Trusted-Advisor.svg',
  'aws-control-tower':          'Management-Tools/AWS-Control-Tower.svg',
  'aws-resource-access-manager': 'Security-Identity/AWS-Resource-Access-Manager.svg',
  // Migration
  'aws-datasync':               'Migration-Modernization/AWS-DataSync.svg',
  'aws-database-migration-service': 'Databases/AWS-Database-Migration-Service.svg',
  'aws-application-migration-service': 'Migration-Modernization/AWS-Application-Migration-Service.svg',
  // Financial
  'aws-cost-explorer':          'Cloud-Financial-Management/AWS-Cost-Explorer.svg',
  'aws-budgets':                'Cloud-Financial-Management/AWS-Budgets.svg',
  'aws-cost-and-usage-report':  'Cloud-Financial-Management/AWS-Cost-and-Usage-Report.svg',
};

const existingRelPaths = new Set(
  allSvgPaths.map(abs => relative(ICONS_DIR, abs).replace(/\\/g, '/'))
);

const uniqueIconKeys = [...new Set(services.map(s => s.icon_key).filter(Boolean))];
const resolved = {};
const missing = [];
const ambiguous = [];

for (const key of uniqueIconKeys) {
  if (MANUAL_ALIASES[key] && existingRelPaths.has(MANUAL_ALIASES[key])) {
    const svc = services.find(s => s.icon_key === key);
    resolved[key] = { file: MANUAL_ALIASES[key], name: svc?.name ?? key, source: 'manual' };
    continue;
  }

  const keySlug = slugify(key);
  const bareSlug = stripPrefix(keySlug);
  const candidates = [...new Set([...(slugToFiles[keySlug] ?? []), ...(slugToFiles[bareSlug] ?? [])])];

  if (candidates.length === 1) {
    const svc = services.find(s => s.icon_key === key);
    resolved[key] = { file: candidates[0], name: svc?.name ?? key, source: 'fuzzy' };
  } else if (candidates.length > 1) {
    ambiguous.push({ icon_key: key, candidates });
    const svc = services.find(s => s.icon_key === key);
    resolved[key] = { file: candidates[0], name: svc?.name ?? key, source: 'ambiguous', candidates };
  } else {
    missing.push(key);
  }
}

const usedFiles = new Set(Object.values(resolved).map(r => r.file));
const unusedSvgs = allSvgPaths
  .map(abs => relative(ICONS_DIR, abs).replace(/\\/g, '/'))
  .filter(rel => !usedFiles.has(rel));

// Source manifest
const sourceManifest = {};
for (const [key, val] of Object.entries(resolved)) {
  sourceManifest[key] = { file: val.file, name: val.name, source: val.source };
  if (val.candidates) sourceManifest[key].candidates = val.candidates;
}

mkdirSync(join(ROOT, 'docs/audits'), { recursive: true });
writeFileSync(join(ROOT, 'docs/audits/aws-icon-manifest.json'), JSON.stringify(sourceManifest, null, 2), 'utf8');

// Runtime manifest
mkdirSync(join(ROOT, 'public/data'), { recursive: true });
const runtimeManifest = {};
for (const [key, val] of Object.entries(resolved)) {
  runtimeManifest[key] = { file: val.file, name: val.name };
}
writeFileSync(join(ROOT, 'public/data/aws-icon-manifest.json'), JSON.stringify(runtimeManifest, null, 2), 'utf8');

// Audit report
const auditReport = {
  generated_at: new Date().toISOString(),
  total_svg_files: allSvgPaths.length,
  required_icon_keys: uniqueIconKeys.length,
  resolved_icon_keys: Object.keys(resolved).length,
  missing_icon_keys: missing.length,
  ambiguous_icon_keys: ambiguous.length,
  unused_svg_files: unusedSvgs.length,
  missing,
  ambiguous,
  unused_svg_files_list: unusedSvgs,
};
writeFileSync(join(ROOT, 'docs/audits/aws-icon-audit-report.json'), JSON.stringify(auditReport, null, 2), 'utf8');

console.log('\n── Icon Manifest Build ───────────────────────────────────────');
console.log(`  Total SVGs         : ${allSvgPaths.length}`);
console.log(`  Required icon_keys : ${uniqueIconKeys.length}`);
console.log(`  Resolved           : ${Object.keys(resolved).length}`);
console.log(`  Missing            : ${missing.length}`);
if (missing.length) missing.forEach(k => console.warn(`    ⚠ missing: ${k}`));
console.log(`  Ambiguous          : ${ambiguous.length}`);
console.log(`  Unused SVGs        : ${unusedSvgs.length}`);
console.log('  Source manifest → docs/audits/aws-icon-manifest.json');
console.log('  Runtime manifest → public/data/aws-icon-manifest.json');
console.log('  Audit report     → docs/audits/aws-icon-audit-report.json\n');

// Only fail on unexpected missing (QuickSight is known-absent from the pack)
const knownMissing = ['amazon-quicksight'];
const unexpectedMissing = missing.filter(k => !knownMissing.includes(k));
if (unexpectedMissing.length > 0) {
  console.error('  ✗ Unexpected missing icon_keys:', unexpectedMissing.join(', '));
  process.exit(1);
}
