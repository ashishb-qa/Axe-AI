import { readFile } from 'node:fs/promises';
import type { ComplianceReport } from '../src/types.js';

const reportPath = process.argv[2] ?? 'reports/rgaa-compliance-report.json';
const report = JSON.parse(await readFile(reportPath, 'utf8')) as ComplianceReport;

console.log(`RGAA score: ${report.summary.compliance_score}%`);
console.log(`Status: ${report.summary.status}`);
console.log(`Risk: ${report.summary.risk}`);
console.log(`Violations: ${report.violations.length}`);
