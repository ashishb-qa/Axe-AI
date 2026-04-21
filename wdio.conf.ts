import 'dotenv/config';
import type { Options } from '@wdio/types';
import { registerAccessibilityCommands } from './src/commands/accessibility.commands.js';

const browserName = process.env.BROWSER_NAME ?? 'chrome';
const capabilities: Options.Testrunner['capabilities'] =
  browserName === 'chrome'
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

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./src/specs/**/*.spec.ts'],
  maxInstances: 2,
  logLevel: 'info',
  bail: 0,
  baseUrl: process.env.BASE_URL ?? 'https://dequeuniversity.com',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  services: [
  ],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000
  },
  capabilities,
  before() {
    registerAccessibilityCommands();
  }
};
