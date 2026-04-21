import AxeBuilder from '@axe-core/webdriverio';
import type { Result, RunOptions } from 'axe-core';

declare global {
  namespace WebdriverIO {
    interface Browser {
      runAxeScan(options?: RunOptions): Promise<Result[]>;
    }
  }
}

export function registerAccessibilityCommands() {
  browser.addCommand('runAxeScan', async function runAxeScan(options?: RunOptions) {
    const results = await new AxeBuilder({ client: browser }).options(options ?? {}).analyze();
    return results.violations;
  });
}
