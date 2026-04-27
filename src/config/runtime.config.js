"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtimeConfig = void 0;
exports.runtimeConfig = {
    baseUrl: process.env.BASE_URL ?? 'https://webtestingcourse.dequecloud.com/',
    threshold: Number(process.env.RGAA_THRESHOLD ?? 85),
    ruleTags: (process.env.RGAA_RULE_TAGS ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ai: {
        provider: process.env.AI_PROVIDER ?? 'heuristic',
        endpoint: process.env.AI_ENDPOINT ?? 'https://api.mistral.ai/v1/chat/completions',
        apiKey: process.env.AI_API_KEY,
        model: process.env.AI_MODEL ?? 'mistral-small-latest'
    },
    exports: {
        elasticsearchUrl: process.env.ELASTICSEARCH_URL,
        slackWebhookUrl: process.env.SLACK_WEBHOOK_URL
    }
};
