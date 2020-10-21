import fse from "fs-extra";
import { JSDOM } from "jsdom";
import mhtml2html from "mhtml2html";
import { join } from "path";
import puppeteer from "puppeteer-extra";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page } from "puppeteer-extra/dist/puppeteer";
import useProxy from "puppeteer-page-proxy";
import logger from "../../utils/logger";
import blockedSites from "./blocked";
import { getRandomProxy } from "./proxy";

logger.info("applying puppeteer-extra plugins");
puppeteer.use(StealthPlugin());
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));

const injectHTML = fse
  .readFileSync(join(__dirname, "../../assets", "inject.html"))
  .toString();
const blockedRegExp = new RegExp("(" + blockedSites.join("|") + ")", "i");

async function interceptRequest(page: Page) {
  await page.setRequestInterception(true);
  const proxy = await getRandomProxy();
  logger.info("Using proxy");
  logger.info(proxy);

  page.on("request", async (request) => {
    try {
      const url = request.url();
      if (blockedRegExp.test(url)) {
        request.abort();
      } else {
        await useProxy(request, proxy);
      }
    } catch (e) {
      logger.error(e.message);
    }
  });

  page.on("requestfinished", async (request) => {
    const response = request.response();
    if (response?.url() == page.url()) {
      logger.info("request finished");

      logger.info(
        JSON.stringify(
          {
            status: response?.status(),
            url: response?.url(),
            statusText: response?.statusText(),
            text: response?.text(),
          },
          null,
          2
        )
      );
    }
  });
}

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
  const browser = await puppeteer.connect({
    browserWSEndpoint: `ws://chrome:3000`,
  });

  logger.info("CONNECTED");

  const page = await browser.newPage();

  await interceptRequest(page);
  await page.goto(url, { waitUntil: "networkidle2" });

  await page.waitForTimeout(waitFor);

  if (pauseMedia) {
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

  await page.evaluate(
    async ({ scrollToBottom }) => {
      if (!scrollToBottom) return;
      else {
        const sHeight = document.documentElement.scrollHeight;
        let sBy = 200;
        await new Promise((resolve) => {
          setTimeout(function cb() {
            if (sBy > sHeight) return resolve();
            window.scrollBy(0, sBy);
            sBy += 200;
            setTimeout(cb, 200);
          }, 200);
        });
      }

      return;
    },
    { scrollToBottom }
  );

  const cdp = await page.target().createCDPSession();
  const { data } = (await cdp.send("Page.captureSnapshot", {
    format: "mhtml",
  })) as { data: string };

  page.close();

  const htmlDoc = mhtml2html.convert(data, {
    parseDOM: (html: string) => new JSDOM(html),
  }) as JSDOM;

  htmlDoc.window.document.head.insertAdjacentHTML("beforeend", injectHTML);
  htmlDoc.window.document
    .querySelectorAll("iframe[src^=cid]")
    .forEach((frame) => frame.remove());

  return htmlDoc;
}
