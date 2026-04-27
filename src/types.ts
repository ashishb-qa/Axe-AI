export type AutomationType = 'FULL' | 'SEMI' | 'MANUAL';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ComplianceStatus = 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';

export interface RgaaRule {
  rgaa_id: string;
  theme: string;
  wcag_ref: string;
  description: string;
  automation_type: AutomationType;
  axe_rule: string | null;
  ai_required: boolean;
  severity: Severity;
  test_strategy: string;
}

export interface AiEvaluation {
  type: 'alt_text' | 'link_clarity' | 'form_labels' | 'visual_contrast' | 'focus_visibility';
  score: number;
  valid: boolean;
  reason: string;
}

export interface ComplianceViolation {
  rgaa_id: string;
  wcag: string;
  severity: Severity;
  element: string;
  selector?: string;
  issue: string;
  automation_type: AutomationType;
  axe_rule?: string;
  ai_score?: number;
  recommendation: string;
}

export interface PageResult {
  url: string;
  scan_date: string;
  violations: ComplianceViolation[];
  compliance_score: number;
  status: ComplianceStatus;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ComplianceReport {
  summary: {
    url: string;
    scan_date: string;
    compliance_score: number;
    status: ComplianceStatus;
    risk: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  pages: PageResult[];
  violations: ComplianceViolation[];
  coverage: {
    total_rules: number;
    automated: number;
    semi_automated: number;
    manual: number;
    mapped_rules: number;
    sample_mapping_breakdown?: { automated: number; semi_automated: number; manual: number };
  };
  overrides?: Record<string, string>;
}
