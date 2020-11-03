import { JSDOM } from "jsdom";
import mhtml2html from "mhtml2html";
import { Browser, Page } from "puppeteer-extra/dist/puppeteer";
import puppeteer from "puppeteer-extra";
import logger from "../../utils/logger";
import config from "../../config";

let launchedBrowser: Promise<Browser>;

console.log("use local chrome", config.USE_LOCAL_CHROME);
if (config.USE_LOCAL_CHROME) {
  launchedBrowser = puppeteer.launch({
    headless: false,
  });
}

export async function captureCurrentDOM(page: Page): Promise<JSDOM> {
  try {
    if (page.isClosed()) return new JSDOM();

    const cdp = await page.target().createCDPSession();

    const { data } = (await cdp.send("Page.captureSnapshot", {
      format: "mhtml",
    })) as { data: string };

    const htmlDoc = mhtml2html.convert(data, {
      parseDOM: (html: string) => new JSDOM(html),
    }) as JSDOM;

    htmlDoc.window.document
      .querySelectorAll("iframe[src^=cid]")
      .forEach((frame) => frame.remove());

    return htmlDoc;
  } catch (e) {
    logger.error(`Page.captureSnapshot failed. Returning plain content`);
    return new JSDOM(await page.content());
  }
}

export async function getBrowserWSConnection(): Promise<string> {
  try {
    if (config.USE_LOCAL_CHROME) {
      return await launchedBrowser.then((b) => b.wsEndpoint());
    } else {
      return Promise.resolve(`ws://chrome:3000`);
    }
  } catch (e) {
    return await puppeteer
      .launch({
        headless: false,
      })
      .then((b) => b.wsEndpoint());
  }
}
