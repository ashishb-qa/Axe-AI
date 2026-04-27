"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
const accessibility_commands_js_1 = require("./src/commands/accessibility.commands.js");
const browserName = process.env.BROWSER_NAME ?? 'chrome';
const capabilities = browserName === 'chrome'
    ? [
        {
            browserName: 'chrome',
            'wdio:chromedriverOptions': {
                binary: process.env.CHROMEDRIVER_PATH ?? '/Users/ashishbhadane/Axe-AI/chromedriver'
            },
            'goog:chromeOptions': {
                args: ['--headless=new', '--disable-gpu', '--window-size=1440,1100']
            }
        }
    ]
    : [
        {
            browserName: 'safari'
        }
    ];
exports.config = {
    runner: 'local',
    specs: ['./src/specs/**/*.spec.ts'],
    maxInstances: 2,
    logLevel: 'info',
    bail: 0,
    baseUrl: process.env.BASE_URL ?? 'https://dequeuniversity.com',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 2,
    services: [],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 120000
    },
    capabilities,
    before() {
        (0, accessibility_commands_js_1.registerAccessibilityCommands)();
    }
};
