import fse from "fs-extra";
import { join } from "path";
import puppeteer from "puppeteer-extra";
import { Page } from "puppeteer-extra/dist/puppeteer";
import blocked from "../assets/blocked";

const injectHTML = fse
  .readFileSync(join(__dirname, "../assets", "inject.html"))
  .toString();

const blockedRegExp = new RegExp("(" + blocked.join("|") + ")", "i");

const truncate = (str: string, len: number) =>
  str.length > len ? str.slice(0, len) + "…" : str;

export default class CopifiedEngine {
  constructor(private browserWSEndpoint: string) {}

  async interceptRequests(page: Page): Promise<void> {
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      const url = request.url();
      const method = request.method();

      // Skip data URIs
      if (/^data:/i.test(url)) {
        request.continue();
        return;
      }

      const shortURL = truncate(url, 70);
      // Abort requests that exceeds 15 seconds
      // Also abort if more than 100 requests
      if (blockedRegExp.test(url)) {
        console.log(`❌ ${method} ${shortURL}`);
        request.abort();
      } else {
        console.log(`✅ ${method} ${shortURL}`);
        request.continue();
      }
    });
  }

  async ssr(url: string): Promise<string> {
    const width = 1024;
    const height = 768;

    const browser = await puppeteer.connect({
      browserWSEndpoint: this.browserWSEndpoint,
    });

    const page = await browser.newPage();
    page.setViewport({
      height,
      width,
    });

    await this.interceptRequests(page);

    await page.goto(url, { waitUntil: "networkidle0" });
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

    const modifiedPage = await page.evaluate(
      ({ injectHTML }) => {
        let content = "";
        if (document.doctype) {
          content = new XMLSerializer().serializeToString(document.doctype);
        }

        // Remove scripts except JSON-LD
        // const scripts = document.querySelectorAll(
        //   'script:not([type="application/ld+json"])'
        // );
        // scripts.forEach((s) => s.parentNode?.removeChild(s));

        // Remove import tags
        const imports = document.querySelectorAll("link[rel=import]");
        imports.forEach((i) => i.parentNode?.removeChild(i));

        const { origin, pathname } = location;
        // Inject <base> for loading relative resources
        if (!document.querySelector("base")) {
          const base = document.createElement("base");
          base.href = origin + pathname;
          document.querySelector("head")?.appendChild(base);
        }

        // Try to fix absolute paths
        const absEls = document.querySelectorAll<
          HTMLLinkElement &
            HTMLScriptElement &
            HTMLImageElement &
            HTMLAnchorElement
        >('link[href^="/"], script[src^="/"], img[src^="/"]');
        absEls.forEach((el) => {
          const href = el.getAttribute("href");
          const src = el.getAttribute("src");
          if (src && /^\/[^/]/i.test(src)) {
            el.src = origin + src;
          } else if (href && /^\/[^/]/i.test(href)) {
            el.href = origin + href;
          }
        });

        document.head.insertAdjacentHTML("beforeend", injectHTML);

        content += document.documentElement.outerHTML;

        // Remove comments
        content = content.replace(/<!--[\s\S]*?-->/g, "");

        return content;
      },
      { injectHTML }
    );

    await page.close();

    const date = Date.now();

    await fse.outputFile(
      join(process.cwd(), `public`, `prerendered`, `${date}.html`),
      modifiedPage
    );

    return `/prerendered/${date}.html`;
  }
}
