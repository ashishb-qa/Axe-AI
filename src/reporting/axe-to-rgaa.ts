import type { Result } from 'axe-core';
import { rgaaRuleEngine } from '../rgaa/rgaa-rule-engine.js';
import type { ComplianceViolation } from '../types.js';

export function mapAxeViolationsToRgaa(axeViolations: Result[]): ComplianceViolation[] {
  return axeViolations.flatMap((violation) => {
    const mappedRules = rgaaRuleEngine.byAxeRule(violation.id);
    const fallbackRules = mappedRules.length > 0 ? mappedRules : [];

    return fallbackRules.flatMap((rule) =>
      violation.nodes.map((node) => ({
        rgaa_id: rule.rgaa_id,
        wcag: rule.wcag_ref,
        severity: rule.severity,
        element: node.html,
        selector: node.target.join(', '),
        issue: violation.help,
        automation_type: rule.automation_type,
        axe_rule: violation.id,
        recommendation: violation.helpUrl ? `Review remediation guidance: ${violation.helpUrl}` : 'Fix the accessibility failure according to RGAA methodology.'
      }))
    );
  });
}
