import fse from "fs-extra";
import { JSDOM } from "jsdom";
import mhtml2html from "mhtml2html";
import { join } from "path";
import puppeteer from "puppeteer-extra";
import { Page } from "puppeteer-extra/dist/puppeteer";
import blockedSites from "./blocked";

const injectHTML = fse
  .readFileSync(join(__dirname, "../../assets", "inject.html"))
  .toString();
const blockedRegExp = new RegExp("(" + blockedSites.join("|") + ")", "i");

async function interceptRequest(page: Page) {
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    try {
      const url = request.url();
      if (blockedRegExp.test(url)) {
        request.abort();
      } else {
        request.continue();
      }
    } catch (e) {
      console.log("ONREQUEST", e);
    }
  });
}

export default async function clonePage({
  url,
  browserWSEndpoint,
  waitFor = 1,
  scrollToBottom = true,
  pauseMedia = true,
}: {
  url: string;
  browserWSEndpoint: string;
  waitFor?: number;
  scrollToBottom?: boolean;
  pauseMedia?: boolean;
}): Promise<JSDOM> {
  const width = 1024;
  const height = 768;

  const browser = await puppeteer.connect({
    browserWSEndpoint,
    defaultViewport: {
      width,
      height,
    },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(28 * 1000);

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
