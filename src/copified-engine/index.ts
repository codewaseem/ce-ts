import logger from "../utils/logger";
import clonePage from "./page-cloner";
import {
  getPageCDNPath,
  isUserPageExists,
  saveUserPage,
} from "./resource-handler";

export default async function getCloneFunction(): Promise<
  (userId: string, url: string) => Promise<string>
> {
  return async (userId: string, url: string, forceReload = true) => {
    if (!forceReload && (await isUserPageExists(userId, url))) {
      logger.info("Returning from cache");
      return getPageCDNPath(userId, url);
    }

    try {
      logger.info(`Cloning page ${url}`);
      const htmlDoc = await clonePage({
        url,
      });
      const htmlString = htmlDoc.serialize();

      console.log("parsed html");

      await saveUserPage({ url, userId, pageData: htmlString });
      logger.info("done");
      return getPageCDNPath(userId, url);
    } catch (e) {
      console.log(`Error`, e);
      return "/scrape-error.html";
    }
  };
}
