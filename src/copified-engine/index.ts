import fse from "fs-extra";
import { join } from "path";
import puppeteer from "puppeteer-extra";
import config from "../config";

const injectHTML = fse
  .readFileSync(join(__dirname, "../assets", "inject.html"))
  .toString();

export default class CopifiedEngine {
  constructor(private browserWSEndpoint: string) {}

  async ssr(url: string): Promise<string> {
    const browser = await puppeteer.connect({
      browserWSEndpoint: this.browserWSEndpoint,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });
    await page.evaluate(
      ({ injectHTML }) => {
        document.body.insertAdjacentHTML("beforeend", injectHTML);
      },
      { injectHTML }
    );

    const html = await page.content(); // serialized HTML of page DOM.
    await page.close();

    const date = Date.now();

    await fse.outputFile(join(process.cwd(), `public`, `${date}.html`), html);

    return `http://www.${config.HOSTNAME}:${config.PORT}/${date}.html`;
  }
}
