import fse from "fs-extra";
import { JSDOM } from "jsdom";
import mhtml2html from "mhtml2html";
import { join } from "path";
import puppeteer from "puppeteer-extra";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page } from "puppeteer-extra/dist/puppeteer";
import config from "../../config";
import logger from "../../utils/logger";

logger.info("applying puppeteer-extra plugins");
puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));

const injectHTML = fse
  .readFileSync(join(__dirname, "../../assets", "inject.html"))
  .toString();

export default async function clonePage({
  url,
  waitFor = 1,
  scrollToBottom = true,
  pauseMedia = true,
}: {
  url: string;
  waitFor?: number;
  scrollToBottom?: boolean;
  pauseMedia?: boolean;
}): Promise<JSDOM> {
  const page = await getPage();

  addPageEventListeners(page);

  console.log("fetching", url);
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForTimeout(waitFor);
  if (pauseMedia) {
    pausePageMedia(page);
  }

  console.log("Evaluating page script");
  await evaluateScriptInPage(page, scrollToBottom);

  console.log("Capturing page data");
  const htmlDoc = await getHTMLDoc(page);

  console.log("Done: closing page now");
  await page.close();
  return htmlDoc;
}

async function getHTMLDoc(page: Page) {
  const cdp = await page.target().createCDPSession();
  const { data } = (await cdp.send("Page.captureSnapshot", {
    format: "mhtml",
  })) as { data: string };

  const htmlDoc = mhtml2html.convert(data, {
    parseDOM: (html: string) => new JSDOM(html),
  }) as JSDOM;

  htmlDoc.window.document.head.insertAdjacentHTML("beforeend", injectHTML);
  htmlDoc.window.document
    .querySelectorAll("iframe[src^=cid]")
    .forEach((frame) => frame.remove());

  return htmlDoc;
}

async function evaluateScriptInPage(page: Page, scrollToBottom: boolean) {
  await page.evaluate(
    async ({ scrollToBottom }) => {
      if (!scrollToBottom) return;
      else {
        const sHeight = document.documentElement.scrollHeight;
        let sBy = 300;
        await new Promise((resolve) => {
          setTimeout(function cb() {
            if (sBy > sHeight) return resolve();
            window.scrollBy(0, sBy);
            sBy += 300;
            setTimeout(cb, 100);
          }, 100);
        });
      }

      return;
    },
    { scrollToBottom }
  );
}

function pausePageMedia(page: Page) {
  page.frames().forEach((frame) => {
    frame.evaluate(() => {
      document
        .querySelectorAll<HTMLMediaElement>("video, audio")
        .forEach((m) => {
          if (!m) return;
          if (m.pause) m.pause();
          m.preload = "none";
        });
    });
  });
}

function addPageEventListeners(page: Page) {
  page.on("requestfinished", (request) => {
    console.log("headers", request.headers());
    const response = request.response();
    console.log("response", {
      ok: response?.ok(),
      status: response?.status(),
      url: response?.url(),
    });
  });
}

async function getPage(): Promise<Page> {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `ws://chrome:3000?--proxy-server=${config.PROXY_SERVER}`,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  await page.authenticate({
    username: config.PROXY_SERVER_USERNAME,
    password: config.PROXY_SERVER_PASSWORD,
  });

  return page;
}
