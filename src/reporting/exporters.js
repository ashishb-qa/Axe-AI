"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifySlackOnFailure = exports.exportToElasticsearch = void 0;
const axios_1 = __importDefault(require("axios"));
const runtime_config_js_1 = require("../config/runtime.config.js");
async function exportToElasticsearch(report) {
    if (!runtime_config_js_1.runtimeConfig.exports.elasticsearchUrl) {
        return;
    }
    await axios_1.default.post(`${runtime_config_js_1.runtimeConfig.exports.elasticsearchUrl.replace(/\/$/, '')}/rgaa-reports/_doc`, report, {
        timeout: 15000
    });
}
exports.exportToElasticsearch = exportToElasticsearch;
async function notifySlackOnFailure(report, threshold) {
    if (!runtime_config_js_1.runtimeConfig.exports.slackWebhookUrl || report.summary.compliance_score >= threshold) {
        return;
    }
    await axios_1.default.post(runtime_config_js_1.runtimeConfig.exports.slackWebhookUrl, {
        text: `RGAA compliance failed: ${report.summary.compliance_score}% for ${report.summary.url}. Threshold: ${threshold}%.`
    });
}
exports.notifySlackOnFailure = notifySlackOnFailure;
