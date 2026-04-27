"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const reportPath = process.argv[2] ?? 'reports/rgaa-compliance-report.json';
const report = JSON.parse(await (0, promises_1.readFile)(reportPath, 'utf8'));
console.log(`RGAA score: ${report.summary.compliance_score}%`);
console.log(`Status: ${report.summary.status}`);
console.log(`Risk: ${report.summary.risk}`);
console.log(`Violations: ${report.violations.length}`);
