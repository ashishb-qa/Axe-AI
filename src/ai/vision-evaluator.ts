import type { AiEvaluation } from '../types.js';

export interface VisionProvider {
  evaluateVisualContrast(screenshotBase64: string): Promise<AiEvaluation>;
  evaluateFocusVisibility(beforeBase64: string, afterBase64: string): Promise<AiEvaluation>;
}

export class NoopVisionProvider implements VisionProvider {
  async evaluateVisualContrast(): Promise<AiEvaluation> {
    return {
      type: 'visual_contrast',
      score: 1,
      valid: true,
      reason: 'Vision contrast provider is disabled; CSS-based axe contrast checks are authoritative for this run.'
    };
  }

  async evaluateFocusVisibility(): Promise<AiEvaluation> {
    return {
      type: 'focus_visibility',
      score: 1,
      valid: true,
      reason: 'Vision focus provider is disabled; enable a provider for screenshot-based focus-ring evaluation.'
    };
  }
}
