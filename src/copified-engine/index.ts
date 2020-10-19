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
  return async (userId: string, url: string, forceReload = false) => {
    if (!forceReload && (await isUserPageExists(userId, url))) {
      logger.info("Returning from cache");
      return getPageCDNPath(userId, url);
    }

    try {
      logger.info(`Cloning page ${url}`);
      const htmlDoc = await clonePage({
        url,
      });

      logger.info("Page cloned, saving page");
      await saveUserPage({ url, userId, pageData: htmlDoc.serialize() });
      logger.info("done");
      return getPageCDNPath(userId, url);
    } catch (e) {
      logger.error(e);
    }
    return "";
  };
}
