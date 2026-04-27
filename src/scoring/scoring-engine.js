"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildComplianceReport = exports.statusFromScore = exports.categorizeRisk = exports.computeComplianceScore = void 0;
const rgaa_rule_engine_js_1 = require("../rgaa/rgaa-rule-engine.js");
const weights = {
    CRITICAL: 18,
    HIGH: 12,
    MEDIUM: 6,
    LOW: 3
};
function computeComplianceScore(violations, totalRules = 106) {
    const maxScore = totalRules * weights.HIGH;
    const penalty = violations.reduce((sum, violation) => sum + weights[violation.severity], 0);
    return Math.max(0, Math.round(((maxScore - penalty) / maxScore) * 100));
}
exports.computeComplianceScore = computeComplianceScore;
function categorizeRisk(score, violations) {
    if (score < 70 || violations.some((violation) => violation.severity === 'CRITICAL')) {
        return 'HIGH';
    }
    if (score < 85 || violations.some((violation) => violation.severity === 'HIGH')) {
        return 'MEDIUM';
    }
    return 'LOW';
}
exports.categorizeRisk = categorizeRisk;
function statusFromScore(score) {
    if (score >= 95) {
        return 'COMPLIANT';
    }
    if (score >= 50) {
        return 'PARTIALLY_COMPLIANT';
    }
    return 'NON_COMPLIANT';
}
exports.statusFromScore = statusFromScore;
function buildComplianceReport(url, violations) {
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
        coverage: rgaa_rule_engine_js_1.rgaaRuleEngine.coverage()
    };
}
exports.buildComplianceReport = buildComplianceReport;
