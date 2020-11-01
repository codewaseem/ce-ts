import { JSDOM } from "jsdom";
import mhtml2html from "mhtml2html";
import { Page } from "puppeteer-extra/dist/puppeteer";
import puppeteer from "puppeteer-extra";

const launchedBrowser = puppeteer.launch({
  headless: false,
});

export async function captureCurrentDOM(page: Page): Promise<JSDOM> {
  if (page.isClosed()) return new JSDOM();

  const cdp = await page.target().createCDPSession();

  const { data } = (await cdp.send("Page.captureSnapshot", {
    format: "mhtml",
  })) as { data: string };

  const htmlDoc = mhtml2html.convert(data, {
    parseDOM: (html: string) => new JSDOM(html),
  }) as JSDOM;
  return htmlDoc;
}

export async function getBrowserWSConnection(): Promise<string> {
  try {
    if (process.env.NODE_ENV != "production") {
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
