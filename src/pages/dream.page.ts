import { BasePage } from './base.page.js';

export class DreamPage extends BasePage {
  async open() {
    await super.open('/demo/dream');
  }

  async imagesForAiReview() {
    return browser.execute(() =>
      Array.from(document.querySelectorAll('img')).map((image) => ({
        src: image.getAttribute('src') ?? '',
        alt: image.getAttribute('alt') ?? '',
        context: image.closest('figure, article, section, main, div')?.textContent?.trim().slice(0, 500) ?? ''
      }))
    );
  }

  async linksForAiReview() {
    return browser.execute(() =>
      Array.from(document.querySelectorAll('a')).map((link) => ({
        text: (link.textContent ?? link.getAttribute('aria-label') ?? '').trim(),
        href: link.getAttribute('href') ?? ''
      }))
    );
  }

  async formLabelsForAiReview() {
    return browser.execute(() =>
      Array.from(document.querySelectorAll('input, select, textarea')).map((field) => {
        const id = field.getAttribute('id');
        const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim() : '';
        return {
          field: field.getAttribute('name') ?? id ?? field.tagName.toLowerCase(),
          label: label ?? field.getAttribute('aria-label') ?? '',
          context: field.closest('form')?.textContent?.trim().slice(0, 500) ?? ''
        };
      })
    );
  }
}

export const dreamPage = new DreamPage();
