import { SsrArgs } from "../types/schema-types";
import logger from "../utils/logger";
import downloadPage from "./page-cloner";
import {
  getPageCDNPath,
  isUserPageExists,
  saveUserPage,
} from "./resource-handler";

type Args = {
  userId: string;
} & SsrArgs;

export default async function clonePage({
  userId,
  url,
  options,
}: Args): Promise<string> {
  console.log("url", url);
  console.log("options", options);
  if (!options?.forceReload && (await isUserPageExists(userId, url))) {
    logger.info("Returning from cache");
    return getPageCDNPath(userId, url);
  }

  try {
    logger.info(`Cloning page ${url}`);
    const htmlDoc = await downloadPage({
      url,
      browserOptions: options?.browserOptions,
    });

    const htmlString = htmlDoc.serialize();

    console.log("parsed html");

    await saveUserPage({ url, userId, pageData: htmlString });
    logger.info("done");
    const pagePath = getPageCDNPath(userId, url);

    logger.info(`path: ${pagePath}`);
    return pagePath;
  } catch (e) {
    console.log(`Error`, e);
    return "/scrape-error.html";
  }
}
