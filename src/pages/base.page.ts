export abstract class BasePage {
  async open(path = '') {
    await browser.url(path);
  }

  async title() {
    return browser.getTitle();
  }
}
