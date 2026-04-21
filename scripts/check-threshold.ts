import { readFile } from 'node:fs/promises';
import type { ComplianceReport } from '../src/types.js';

const reportPath = process.argv[2] ?? 'reports/rgaa-compliance-report.json';
const threshold = Number(process.argv[3] ?? process.env.RGAA_THRESHOLD ?? 85);
const report = JSON.parse(await readFile(reportPath, 'utf8')) as ComplianceReport;

if (report.summary.compliance_score < threshold) {
  throw new Error(`Accessibility compliance failed: ${report.summary.compliance_score}% < ${threshold}%`);
}

console.log(`Accessibility compliance passed: ${report.summary.compliance_score}% >= ${threshold}%`);
