import puppeteer from "puppeteer-extra";

export async function getBrowserWSEndpoint(): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const browserWSEndpoint = await browser.wsEndpoint();

  return browserWSEndpoint;
}
