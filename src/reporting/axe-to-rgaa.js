"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAxeViolationsToRgaa = void 0;
const rgaa_rule_engine_js_1 = require("../rgaa/rgaa-rule-engine.js");
function mapAxeViolationsToRgaa(axeViolations) {
    return axeViolations.flatMap((violation) => {
        const mappedRules = rgaa_rule_engine_js_1.rgaaRuleEngine.byAxeRule(violation.id);
        const fallbackRules = mappedRules.length > 0 ? mappedRules : [];
        return fallbackRules.flatMap((rule) => violation.nodes.map((node) => ({
            rgaa_id: rule.rgaa_id,
            wcag: rule.wcag_ref,
            severity: rule.severity,
            element: node.html,
            selector: node.target.join(', '),
            issue: violation.help,
            automation_type: rule.automation_type,
            axe_rule: violation.id,
            recommendation: violation.helpUrl ? `Review remediation guidance: ${violation.helpUrl}` : 'Fix the accessibility failure according to RGAA methodology.'
        })));
    });
}
exports.mapAxeViolationsToRgaa = mapAxeViolationsToRgaa;
