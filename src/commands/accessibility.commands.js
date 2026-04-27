"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAccessibilityCommands = void 0;
const webdriverio_1 = __importDefault(require("@axe-core/webdriverio"));
function registerAccessibilityCommands() {
    browser.addCommand('runAxeScan', async function runAxeScan(options) {
        const results = await new webdriverio_1.default({ client: browser }).options(options ?? {}).analyze();
        return results.violations;
    });
}
exports.registerAccessibilityCommands = registerAccessibilityCommands;
