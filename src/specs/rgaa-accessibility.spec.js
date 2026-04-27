"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@wdio/globals");
const runtime_config_js_1 = require("../config/runtime.config.js");
const dream_page_js_1 = require("../pages/dream.page.js");
const ai_evaluator_js_1 = require("../ai/ai-evaluator.js");
const axe_to_rgaa_js_1 = require("../reporting/axe-to-rgaa.js");
const exporters_js_1 = require("../reporting/exporters.js");
const report_writer_js_1 = require("../reporting/report-writer.js");
const scoring_engine_js_1 = require("../scoring/scoring-engine.js");
describe('RGAA 4.1.2 accessibility compliance @rgaa', () => {
    it('scans Deque University DREAM page with axe and AI semantic validation @rgaa:1.1 @rgaa:1.3 @rgaa:6.1 @rgaa:11.2', async () => {
        await dream_page_js_1.dreamPage.open();
        const axeViolations = await browser.runAxeScan({
            runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
            }
        });
        const violations = (0, axe_to_rgaa_js_1.mapAxeViolationsToRgaa)(axeViolations);
        const images = await dream_page_js_1.dreamPage.imagesForAiReview();
        for (const image of images.filter((candidate) => candidate.alt)) {
            const evaluation = await (0, ai_evaluator_js_1.evaluateAltTextMeaningfulness)(image.context || image.src, image.alt);
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
        const links = await dream_page_js_1.dreamPage.linksForAiReview();
        const filteredLinks = links.filter((candidate) => candidate.text);
        const linkEvaluations = await (0, ai_evaluator_js_1.evaluateLinkClarityBatch)(filteredLinks.map((l) => l.text));
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
        const formLabels = await dream_page_js_1.dreamPage.formLabelsForAiReview();
        const labelEvaluation = await (0, ai_evaluator_js_1.evaluateFormLabels)(formLabels);
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
        const report = (0, scoring_engine_js_1.buildComplianceReport)(await browser.getUrl(), violations);
        await (0, report_writer_js_1.writeJsonReport)(report);
        await (0, report_writer_js_1.writeHtmlReport)(report);
        await (0, exporters_js_1.exportToElasticsearch)(report);
        await (0, exporters_js_1.notifySlackOnFailure)(report, runtime_config_js_1.runtimeConfig.threshold);
        (0, globals_1.expect)(report.summary.compliance_score).toBeGreaterThanOrEqual(runtime_config_js_1.runtimeConfig.threshold);
    });
});
