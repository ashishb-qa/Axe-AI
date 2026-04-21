import axios from 'axios';
import { runtimeConfig } from '../config/runtime.config.js';
import type { ComplianceReport } from '../types.js';

export async function exportToElasticsearch(report: ComplianceReport) {
  if (!runtimeConfig.exports.elasticsearchUrl) {
    return;
  }

  await axios.post(`${runtimeConfig.exports.elasticsearchUrl.replace(/\/$/, '')}/rgaa-reports/_doc`, report, {
    timeout: 15000
  });
}

export async function notifySlackOnFailure(report: ComplianceReport, threshold: number) {
  if (!runtimeConfig.exports.slackWebhookUrl || report.summary.compliance_score >= threshold) {
    return;
  }

  await axios.post(runtimeConfig.exports.slackWebhookUrl, {
    text: `RGAA compliance failed: ${report.summary.compliance_score}% for ${report.summary.url}. Threshold: ${threshold}%.`
  });
}
