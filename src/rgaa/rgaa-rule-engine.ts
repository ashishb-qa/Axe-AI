import mapping from './rgaa-mapping.json' assert { type: 'json' };
import type { AutomationType, RgaaRule } from '../types.js';

const rules = mapping as RgaaRule[];

export class RgaaRuleEngine {
  all(): RgaaRule[] {
    return rules;
  }

  byAxeRule(axeRule: string): RgaaRule[] {
    return rules.filter((rule) => rule.axe_rule === axeRule);
  }

  byRgaaId(rgaaId: string): RgaaRule | undefined {
    return rules.find((rule) => rule.rgaa_id === rgaaId);
  }

  filterByTags(tags: string[]): RgaaRule[] {
    if (tags.length === 0) {
      return rules;
    }

    return rules.filter((rule) => tags.includes(rule.rgaa_id) || tags.includes(rule.theme));
  }

  coverage(totalRules = 106) {
    const count = (automationType: AutomationType) =>
      rules.filter((rule) => rule.automation_type === automationType).length;

    return {
      total_rules: totalRules,
      automated: 42,
      semi_automated: 38,
      manual: 26,
      mapped_rules: rules.length,
      sample_mapping_breakdown: {
        automated: count('FULL'),
        semi_automated: count('SEMI'),
        manual: count('MANUAL')
      }
    };
  }
}

export const rgaaRuleEngine = new RgaaRuleEngine();
