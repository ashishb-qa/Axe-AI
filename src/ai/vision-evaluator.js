"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopVisionProvider = void 0;
class NoopVisionProvider {
    async evaluateVisualContrast() {
        return {
            type: 'visual_contrast',
            score: 1,
            valid: true,
            reason: 'Vision contrast provider is disabled; CSS-based axe contrast checks are authoritative for this run.'
        };
    }
    async evaluateFocusVisibility() {
        return {
            type: 'focus_visibility',
            score: 1,
            valid: true,
            reason: 'Vision focus provider is disabled; enable a provider for screenshot-based focus-ring evaluation.'
        };
    }
}
exports.NoopVisionProvider = NoopVisionProvider;
