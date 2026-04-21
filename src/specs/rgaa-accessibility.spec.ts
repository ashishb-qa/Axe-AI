import { expect } from '@wdio/globals';
import { runtimeConfig } from '../config/runtime.config.js';
import { dreamPage } from '../pages/dream.page.js';
import { evaluateAltTextMeaningfulness, evaluateFormLabels, evaluateLinkClarityBatch } from '../ai/ai-evaluator.js';
import { mapAxeViolationsToRgaa } from '../reporting/axe-to-rgaa.js';
import { exportToElasticsearch, notifySlackOnFailure } from '../reporting/exporters.js';
import { writeHtmlReport, writeJsonReport } from '../reporting/report-writer.js';
import { buildComplianceReport } from '../scoring/scoring-engine.js';
import type { ComplianceViolation } from '../types.js';

describe('RGAA 4.1.2 accessibility compliance @rgaa', () => {
  it('scans Deque University DREAM page with axe and AI semantic validation @rgaa:1.1 @rgaa:1.3 @rgaa:6.1 @rgaa:11.2', async () => {
    await dreamPage.open();

    const axeViolations = await browser.runAxeScan({
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
      }
    });

    const violations: ComplianceViolation[] = mapAxeViolationsToRgaa(axeViolations);

    const images = await dreamPage.imagesForAiReview();
    for (const image of images.filter((candidate) => candidate.alt)) {
      const evaluation = await evaluateAltTextMeaningfulness(image.context || image.src, image.alt);
      if (!evaluation.valid) {
        violations.push({
          rgaa_id: '1.3',
          wcag: '1.1.1',
          severity: 'HIGH',
          element: '<img>',
          issue: 'Image alternative text may not be meaningful.',
          automation_type: 'SEMI',
          ai_score: evaluation.score,
          recommendation: evaluation.reason
        });
      }
    }

    const links = await dreamPage.linksForAiReview();
    const filteredLinks = links.filter((candidate) => candidate.text);
    const linkEvaluations = await evaluateLinkClarityBatch(filteredLinks.map((l) => l.text));
    for (let i = 0; i < filteredLinks.length; i++) {
      const evaluation = linkEvaluations[i];
      if (!evaluation.valid) {
        violations.push({
          rgaa_id: '6.1',
          wcag: '2.4.4',
          severity: 'HIGH',
          element: `<a href="${filteredLinks[i].href}">${filteredLinks[i].text}</a>`,
          issue: 'Link purpose may not be clear.',
          automation_type: 'SEMI',
          ai_score: evaluation.score,
          recommendation: evaluation.reason
        });
      }
    }

    const formLabels = await dreamPage.formLabelsForAiReview();
    const labelEvaluation = await evaluateFormLabels(formLabels);
    if (!labelEvaluation.valid) {
      violations.push({
        rgaa_id: '11.2',
        wcag: '1.3.1,4.1.2',
        severity: 'HIGH',
        element: '<form>',
        issue: 'One or more form labels may not be relevant.',
        automation_type: 'SEMI',
        ai_score: labelEvaluation.score,
        recommendation: labelEvaluation.reason
      });
    }

    const report = buildComplianceReport(await browser.getUrl(), violations);
    await writeJsonReport(report);
    await writeHtmlReport(report);
    await exportToElasticsearch(report);
    await notifySlackOnFailure(report, runtimeConfig.threshold);

    expect(report.summary.compliance_score).toBeGreaterThanOrEqual(runtimeConfig.threshold);
  });
});
