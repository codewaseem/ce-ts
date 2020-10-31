import { BrowserOptions, DirectNavigationOptions } from "puppeteer";
import { Page } from "puppeteer-extra/dist/puppeteer";
import { CEPlugin } from "../types";

const BaseCEPlugin: CEPlugin = {
  async addBrowserOptions(options: BrowserOptions): Promise<void> {
    // do nothing, it will be overloaded by other plugins
  },
  async afterPageOpen(page: Page): Promise<void> {
    // do nothing, it will be overloaded by other plugins
  },
  async setPageNavigationOptions(
    navigationOptions: DirectNavigationOptions
  ): Promise<void> {
    // do nothing, it will be overloaded by other plugins
  },
  async afterPageNavigation(page: Page): Promise<void> {
    // do nothing, it will be overloaded by other plugins
  },
  async addBrowserLaunchFlags(flags: Record<string, string>): Promise<void> {
    // do nothing, it will be overloaded by other plugins
  },
  async runPageScript(page: Page) {
    // do nothing
  },
};

export default BaseCEPlugin;
