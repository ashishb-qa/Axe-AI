# AI-Powered RGAA Compliance Engine

Target standard: RGAA v4.1.2, which is the current RGAA v4 technical method and contains 106 criteria across 13 themes.

## Architecture Diagram

```text
CI/CD Trigger
   |
   v
Jenkins Pipeline
   |
   v
WDIO Test Execution Layer
   |-- Browser orchestration
   |-- Page Object Model
   |-- Reusable accessibility commands
   |
   v
axe-core Scan Layer
   |
   v
RGAA Rule Engine
   |-- RGAA criterion -> WCAG success criterion -> axe rule
   |-- FULL / SEMI / MANUAL automation classification
   |-- Tag-based rule selection
   |
   +------------------+
   |                  |
   v                  v
AI Evaluation Layer   Manual Review Queue
   |-- Alt text semantic validation
   |-- Link purpose clarity
   |-- Form label quality
   |-- Optional vision provider for contrast/focus
   |
   v
Scoring Engine
   |-- Severity-weighted score
   |-- Compliance status
   |-- High / Medium / Low risk
   |
   v
Reporting Layer
   |-- JSON report
   |-- HTML report
   |-- RGAA/WCAG/axe traceability
   |
   v
Enterprise Integrations
   |-- Jenkins threshold gate
   |-- ElasticSearch trend export
   |-- Slack failure notification
```

## Component Interaction Flow

1. Jenkins installs dependencies and runs `npm run test:a11y`.
2. WDIO opens the target page through a Page Object.
3. The reusable `browser.runAxeScan()` command executes axe-core in Chrome.
4. `axe-to-rgaa.ts` maps axe violations to RGAA criteria through `rgaa-rule-engine.ts`.
5. The AI evaluator reviews semantic cases that axe cannot prove: alternative text meaning, link clarity, and label quality.
6. The scoring engine calculates a severity-weighted compliance score and risk category.
7. Report writers persist JSON and HTML reports under `reports/`.
8. Optional exporters send results to ElasticSearch and Slack.
9. Jenkins parses the JSON report and fails the build when the score is below the configured threshold.

## Scaling Strategy For All 106 Rules

The production catalog should be maintained as versioned data, not hard-coded logic:

- Store one JSON record per RGAA criterion with RGAA ID, theme, WCAG reference, axe rule IDs, automation class, severity, AI requirement, and manual-review instructions.
- Use official RGAA 4.1.2 criteria and tests as the source of truth for criterion wording and test methodology.
- Treat axe as the deterministic evidence layer for FULL rules.
- Treat SEMI rules as evidence plus review: axe/WDIO narrows the candidate set, AI adds semantic scoring, and humans confirm edge cases.
- Treat MANUAL rules as audit workflow items with inventories, screenshots, and reviewer prompts.
- Add contract tests that ensure every one of the 106 criteria has an owner, automation type, severity, and reporting strategy.
