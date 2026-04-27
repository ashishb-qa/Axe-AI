"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeHtmlReport = exports.writeJsonReport = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
async function writeJsonReport(report, path = 'reports/rgaa-compliance-report.json') {
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(path), { recursive: true });
    await (0, promises_1.writeFile)(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
exports.writeJsonReport = writeJsonReport;
async function writeHtmlReport(report, path = 'reports/rgaa-compliance-report.html') {
    const rows = report.violations
        .map((violation) => `<tr>
        <td>${violation.rgaa_id}</td>
        <td>${violation.wcag}</td>
        <td>${violation.severity}</td>
        <td>${escapeHtml(violation.issue)}</td>
        <td><code>${escapeHtml(violation.element)}</code></td>
        <td>${escapeHtml(violation.recommendation)}</td>
      </tr>`)
        .join('');
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>RGAA Compliance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #17202a; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #c9d1d9; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef2f6; }
    .score { font-size: 32px; font-weight: 700; }
  </style>
</head>
<body>
  <h1>RGAA Compliance Report</h1>
  <p><strong>URL:</strong> ${escapeHtml(report.summary.url)}</p>
  <p><strong>Scan date:</strong> ${report.summary.scan_date}</p>
  <p class="score">${report.summary.compliance_score}% - ${report.summary.status} - ${report.summary.risk} risk</p>
  <h2>Violations</h2>
  <table>
    <thead><tr><th>RGAA</th><th>WCAG</th><th>Severity</th><th>Issue</th><th>Element</th><th>Recommendation</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(path), { recursive: true });
    await (0, promises_1.writeFile)(path, html, 'utf8');
}
exports.writeHtmlReport = writeHtmlReport;
function escapeHtml(value) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
