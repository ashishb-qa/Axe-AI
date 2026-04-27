"use strict";
exports.__esModule = true;
exports.rgaaRuleEngine = exports.RgaaRuleEngine = void 0;
var rgaa_mapping_json_1 = require("./rgaa-mapping.json");
var rules = rgaa_mapping_json_1["default"];
var RgaaRuleEngine = /** @class */ (function () {
    function RgaaRuleEngine() {
    }
    RgaaRuleEngine.prototype.all = function () {
        return rules;
    };
    RgaaRuleEngine.prototype.byAxeRule = function (axeRule) {
        return rules.filter(function (rule) { return rule.axe_rule === axeRule; });
    };
    RgaaRuleEngine.prototype.byRgaaId = function (rgaaId) {
        return rules.find(function (rule) { return rule.rgaa_id === rgaaId; });
    };
    RgaaRuleEngine.prototype.filterByTags = function (tags) {
        if (tags.length === 0) {
            return rules;
        }
        return rules.filter(function (rule) { return tags.includes(rule.rgaa_id) || tags.includes(rule.theme); });
    };
    RgaaRuleEngine.prototype.coverage = function (totalRules) {
        if (totalRules === void 0) { totalRules = rules.length; }
        var count = function (automationType) {
            return rules.filter(function (rule) { return rule.automation_type === automationType; }).length;
        };
        return {
            total_rules: totalRules,
            automated: count('FULL'),
            semi_automated: count('SEMI'),
            manual: count('MANUAL'),
            mapped_rules: rules.length,
            sample_mapping_breakdown: {
                automated: count('FULL'),
                semi_automated: count('SEMI'),
                manual: count('MANUAL')
            }
        };
    };
    return RgaaRuleEngine;
}());
exports.RgaaRuleEngine = RgaaRuleEngine;
exports.rgaaRuleEngine = new RgaaRuleEngine();
