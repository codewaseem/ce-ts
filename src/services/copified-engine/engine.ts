import { Browser, Page } from "puppeteer-extra/dist/puppeteer";
import puppeteer from "puppeteer-extra";
import qs from "querystring";
import { BrowserOptions, DirectNavigationOptions } from "puppeteer";
import {
  ProxyPlugin,
  WaitForPlugin,
  PageOptionsPlugin,
  InjectToDomPlugin,
  TimeTrackerPlugin,
  CEEventPlugin,
} from "./plugins";
import { CEPlugin } from "./types";
import { captureCurrentDOM, getBrowserWSConnection } from "./utils";
import logger from "../../utils/logger";

interface CopifiedEngineProps {
  url: string;
  plugins?: CEPlugin[];
}

const MAX_NAVIGATION_TIMEOUT = 60 * 1000; // 60 seconds

export default class CopifiedEngine {
  private plugins: CEPlugin[];
  private url: string;

  private browser!: Browser;
  private page!: Page;

  constructor({ url, plugins = [] }: CopifiedEngineProps) {
    this.plugins = plugins;
    this.url = url;
  }

  async clone(): Promise<string> {
    try {
      return this.execute();
    } catch (e) {
      logger.error(e);
      if (this.page && !this.page.isClosed()) await this.page.close();
      return "";
    }
  }

  private async execute(): Promise<string> {
    for (const plugin of this.plugins) {
      await plugin.events.onStart();
    }

    await this.connectToBrowser();
    await this.openPage();
    await this.navigateToURL();
    await this.runPageScripts();
    const content = await this.capturePage();
    await this.closePage();

    for (const plugin of this.plugins) {
      await plugin.events.onFinish(content);
    }

    return content;
  }

  private async capturePage() {
    for (const plugin of this.plugins) {
      await plugin.events.beforePageCapture(this.page);
    }

    const htmlDoc = await captureCurrentDOM(this.page);

    for (const plugin of this.plugins) {
      await plugin.events.afterPageCapture(this.page, htmlDoc);
    }

    return htmlDoc.serialize();
  }

  private async runPageScripts() {
    for (const plugin of this.plugins) {
      await plugin.events.beforeRunPageScript(this.page);
    }
    for (const plugin of this.plugins) {
      await plugin.methods.runPageScript(this.page);
    }
    for (const plugin of this.plugins) {
      await plugin.events.afterRunPageScript(this.page);
    }
  }

  private async navigateToURL(): Promise<void> {
    const navigationOptions: DirectNavigationOptions = {};

    for (const plugin of this.plugins) {
      await Promise.all([
        plugin.events.beforePageNavigation(this.page),
        plugin.methods.setPageNavigationOptions(navigationOptions),
      ]);
    }

    await Promise.race([
      this.page.goto(this.url, navigationOptions),
      new Promise((resolve) => setTimeout(resolve, MAX_NAVIGATION_TIMEOUT)),
    ]);

    for (const plugin of this.plugins) {
      await plugin.events.afterPageNavigation(this.page);
    }
  }

  private async openPage(): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.events.beforePageOpen(this.browser);
    }

    this.page = await this.browser.newPage();

    for (const plugin of this.plugins) {
      await plugin.events.afterPageOpen(this.page);
    }
  }

  private async connectToBrowser(): Promise<void> {
    const launchFlags = {};
    const browserOptions: BrowserOptions = {};

    for (const plugin of this.plugins) {
      await Promise.all([
        plugin.events.beforeBrowserOpen(),
        plugin.methods.addBrowserLaunchFlags(launchFlags),
        plugin.methods.addBrowserOptions(browserOptions),
      ]);
    }

    const browserArgsString = qs.stringify(launchFlags, undefined, undefined, {
      encodeURIComponent: qs.unescape,
    });

    const wsConnectionEndpoint = await getBrowserWSConnection();

    this.browser = await puppeteer.connect({
      browserWSEndpoint: `${wsConnectionEndpoint}${
        browserArgsString.length ? `?${browserArgsString}` : ""
      }`,
      ...browserOptions,
    });

    for (const plugin of this.plugins)
      plugin.events.afterBrowserOpen(this.browser);
  }

  private async closePage(): Promise<void> {
    await this.page.close();
  }
}

if (require.main == module) {
  const cpe = new CopifiedEngine({
    url: "https://noon.com",
    plugins: [
      CEEventPlugin,
      ProxyPlugin,
      PageOptionsPlugin({
        width: 480,
        userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1`,
      }),
      WaitForPlugin({
        waitUntil: "load",
      }),
      InjectToDomPlugin,
      TimeTrackerPlugin(),
    ],
  });
  cpe.clone();
}
