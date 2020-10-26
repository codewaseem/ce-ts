import logger from "../utils/logger";
import downloadPage from "./page-cloner";
import {
  getPageCDNPath,
  isUserPageExists,
  saveUserPage,
} from "./resource-handler";

type Args = {
  userId: string;
  url: string;
  forceReload?: boolean;
};

export default async function clonePage({
  userId,
  url,
  forceReload = false,
}: Args): Promise<string> {
  console.log("forceReload", forceReload);
  if (!forceReload && (await isUserPageExists(userId, url))) {
    logger.info("Returning from cache");
    return getPageCDNPath(userId, url);
  }

  try {
    logger.info(`Cloning page ${url}`);
    const htmlDoc = await downloadPage({
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
}
