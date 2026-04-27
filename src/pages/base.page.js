"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePage = void 0;
class BasePage {
    async open(path = '') {
        await browser.url(path);
    }
    async title() {
        return browser.getTitle();
    }
}
exports.BasePage = BasePage;
