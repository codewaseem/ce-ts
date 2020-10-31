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
} from "./plugins";
import { CEPlugin } from "./types";
import fse from "fs-extra";
import { join } from "path";
import { JSDOM } from "jsdom";
import mhtml2html from "mhtml2html";

interface CopifiedEngineProps {
  url: string;
  plugins?: CEPlugin[];
}

class CopifiedEngine {
  private plugins: CEPlugin[];
  private url: string;

  private browser!: Browser;
  private page!: Page;

  constructor({ url, plugins = [] }: CopifiedEngineProps) {
    this.plugins = plugins;
    this.url = url;
  }

  async execute() {
    for (const plugin of this.plugins) {
      await plugin.events.onStart();
    }

    await this.openBrowser();
    await this.openPage();
    await this.navigateToURL();
    await this.runPageScripts();
    const content = await this.capturePage();
    await this.closeBrowser();

    for (const plugin of this.plugins) {
      await plugin.events.onFinish();
    }

    return content;
  }

  private async capturePage() {
    for (const plugin of this.plugins) {
      await plugin.events.beforePageCapture(this.page);
    }

    const cdp = await this.page.target().createCDPSession();
    const { data } = (await cdp.send("Page.captureSnapshot", {
      format: "mhtml",
    })) as { data: string };

    const htmlDoc = mhtml2html.convert(data, {
      parseDOM: (html: string) => new JSDOM(html),
    }) as JSDOM;

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

    await this.page.goto(this.url, navigationOptions);

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

  private async openBrowser(): Promise<void> {
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

    this.browser =
      process.env.NODE_ENV != "production"
        ? await puppeteer.launch({
            headless: false,
            args: browserArgsString.split("&"),
            ...browserOptions,
          })
        : await puppeteer.connect({
            browserWSEndpoint: `ws://chrome:3000${
              browserArgsString.length ? `?${browserArgsString}` : ""
            }`,
            ...browserOptions,
          });

    for (const plugin of this.plugins)
      plugin.events.afterBrowserOpen(this.browser);
  }

  private async closeBrowser(): Promise<void> {
    await this.browser.close();
  }
}

if (require.main == module) {
  const cpe = new CopifiedEngine({
    url: "https://noon.com",
    plugins: [
      ProxyPlugin,
      PageOptionsPlugin({
        width: 480,
        userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1`,
      }),
      WaitForPlugin({
        waitUntil: "networkidle2",
      }),
      InjectToDomPlugin,
      TimeTrackerPlugin(),
    ],
  });
  cpe
    .execute()
    .then((content) => fse.outputFile(join(__dirname, "test.html"), content));
}
