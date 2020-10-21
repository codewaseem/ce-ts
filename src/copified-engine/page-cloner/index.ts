import fse from "fs-extra";
import { JSDOM } from "jsdom";
import mhtml2html from "mhtml2html";
import { join } from "path";
import puppeteer from "puppeteer-extra";
// import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page } from "puppeteer-extra/dist/puppeteer";
import useProxy from "puppeteer-page-proxy";
import logger from "../../utils/logger";

logger.info("applying puppeteer-extra plugins");
puppeteer.use(StealthPlugin());
// puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));

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
  const browser = await puppeteer.connect({
    browserWSEndpoint: `ws://chrome:3000`,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  await interceptRequest(page);
  try {
    console.log("cloning", url);
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
  } catch (e) {
    console.log("page load error", e);
  }

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

async function interceptRequest(page: Page) {
  try {
    await page.setRequestInterception(true);
    await applyProxy(page);
    logRequestFinish(page);
  } catch (e) {
    logger.info("ERROR WHILE PROXYING");
    console.log(e);
  }
}

function logRequestFinish(page: Page) {
  page.on("requestfinished", async (req) => {
    console.log("Request finished");
    // if (req.url() == page.url()) {
    const response = req.response();
    console.log(req.headers());
    console.log({
      status: response?.status(),
      url: response?.url(),
      statusText: response?.statusText(),
    });
    const status = response?.status() ?? 200;
    if (status >= 400 && status < 600) {
      console.log({ body: await response?.text() });
    }
    // }
  });
}

async function applyProxy(page: Page) {
  const proxy = `http://rykgwtyg-rotate:dzo1s0n1pl9r@p.webshare.io:80`;
  logger.info("Using proxy");
  logger.info(proxy);
  await useProxy(page, proxy);
}
