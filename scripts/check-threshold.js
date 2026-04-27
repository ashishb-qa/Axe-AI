"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const reportPath = process.argv[2] ?? 'reports/rgaa-compliance-report.json';
const threshold = Number(process.argv[3] ?? process.env.RGAA_THRESHOLD ?? 85);
const report = JSON.parse(await (0, promises_1.readFile)(reportPath, 'utf8'));
if (report.summary.compliance_score < threshold) {
    throw new Error(`Accessibility compliance failed: ${report.summary.compliance_score}% < ${threshold}%`);
}
console.log(`Accessibility compliance passed: ${report.summary.compliance_score}% >= ${threshold}%`);
