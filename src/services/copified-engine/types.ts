import { BrowserOptions, DirectNavigationOptions } from "puppeteer";
import { Page } from "puppeteer-extra/dist/puppeteer";

export interface CEPlugin {
  addBrowserLaunchFlags(flags: Record<string, string>): Promise<void>;
  addBrowserOptions(options: BrowserOptions): Promise<void>;
  afterPageOpen(page: Page): Promise<void>;
  setPageNavigationOptions(
    navigationOptions: DirectNavigationOptions
  ): Promise<void>;
  afterPageNavigation(page: Page): Promise<void>;
  runPageScript(page: Page): Promise<void>;
}
