import type { ComplianceReport, ComplianceStatus, ComplianceViolation, Severity } from '../types.js';
import { rgaaRuleEngine } from '../rgaa/rgaa-rule-engine.js';

const weights: Record<Severity, number> = {
  CRITICAL: 18,
  HIGH: 12,
  MEDIUM: 6,
  LOW: 3
};

export function computeComplianceScore(violations: ComplianceViolation[], totalRules = 106) {
  const maxScore = totalRules * weights.HIGH;
  const penalty = violations.reduce((sum, violation) => sum + weights[violation.severity], 0);
  return Math.max(0, Math.round(((maxScore - penalty) / maxScore) * 100));
}

export function categorizeRisk(score: number, violations: ComplianceViolation[]): ComplianceReport['summary']['risk'] {
  if (score < 70 || violations.some((violation) => violation.severity === 'CRITICAL')) {
    return 'HIGH';
  }
  if (score < 85 || violations.some((violation) => violation.severity === 'HIGH')) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export function statusFromScore(score: number): ComplianceStatus {
  if (score >= 95) {
    return 'COMPLIANT';
  }
  if (score >= 50) {
    return 'PARTIALLY_COMPLIANT';
  }
  return 'NON_COMPLIANT';
}

export function buildComplianceReport(url: string, violations: ComplianceViolation[]): ComplianceReport {
  const complianceScore = computeComplianceScore(violations);

  return {
    summary: {
      url,
      scan_date: new Date().toISOString(),
      compliance_score: complianceScore,
      status: statusFromScore(complianceScore),
      risk: categorizeRisk(complianceScore, violations)
    },
    violations,
    coverage: rgaaRuleEngine.coverage()
  };
}
