import { JSDOM } from "jsdom";
import { BrowserOptions, DirectNavigationOptions } from "puppeteer";
import { Browser, Page } from "puppeteer-extra/dist/puppeteer";

export const BaseCEPlugin = {
  events: {
    async onStart(): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },

    async onFinish(): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },

    async beforeBrowserOpen(): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
    async afterBrowserOpen(browser: Browser): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },

    async beforePageOpen(browser: Browser): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
    async afterPageOpen(page: Page): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },

    async beforePageNavigation(page: Page): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
    async afterPageNavigation(page: Page): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },

    async beforeRunPageScript(page: Page): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
    async afterRunPageScript(page: Page): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },

    async beforePageCapture(page: Page): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
    async afterPageCapture(page: Page, htmlDoc: JSDOM): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
  },

  methods: {
    async addBrowserLaunchFlags(flags: Record<string, string>): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
    async addBrowserOptions(options: BrowserOptions): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
    async setPageNavigationOptions(
      navigationOptions: DirectNavigationOptions
    ): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
    async runPageScript(page: Page): Promise<void> {
      // do nothing, it will be overloaded with other plugins
    },
  },
};

export type CEPlugin = typeof BaseCEPlugin;
