import { Publisher } from "type-graphql";
import { PageClonePayload } from "../../../graphql/types";
import logger from "../../../utils/logger";
import { saveToCache } from "../cache";
import { BaseCEPlugin, CEPlugin } from "../types";
import { captureCurrentDOM } from "../utils";
import fse from "fs-extra";
import { join } from "path";
import { Page } from "puppeteer-extra/dist/puppeteer";

const injectHTML = fse
  .readFileSync(join(__dirname, "../../../assets", "inject.html"))
  .toString();

const UPDATE_STATUS_INTERVAL = 3 * 1000; // 3 seconds;
const SEND_PAGE_CONTENT_INTERVAL = 15 * 1000; // 15 seconds;

const GraphQLSubsPlugin = (
  publish: Publisher<PageClonePayload>,
  basePayload: Partial<PageClonePayload>
): CEPlugin => {
  let totalRequests = 0;
  let completedRequests = 0;
  let stopPushing = false;
  let tempStaticURL = "";
  let inProcess = false;
  const status = "loading";

  const publishState = () =>
    publish({
      ...(basePayload as PageClonePayload),
      tempStaticURL,
      completedRequests,
      totalRequests,
      status,
    });

  const plugin: CEPlugin = {
    ...BaseCEPlugin,
    events: {
      ...BaseCEPlugin.events,

      async beforePageNavigation(page) {
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          totalRequests++;
          request.continue();
        });

        page.on("requestfinished", () => {
          completedRequests++;
        });

        const pushStateTimer = setInterval(() => {
          if (stopPushing && page.isClosed()) {
            clearInterval(pushStateTimer);
          } else {
            publishState();
          }
        }, UPDATE_STATUS_INTERVAL);

        const timer = setInterval(async function cb() {
          if (stopPushing || page.isClosed()) {
            clearInterval(timer);
          } else {
            if (inProcess) return;

            inProcess = true;
            captureDOMHelper(page, basePayload)
              .then((tempPath) => {
                logger.info(tempPath);
                tempStaticURL = tempPath;
                inProcess = false;
                publishState();
              })
              .catch((e) => {
                inProcess = false;
                logger.error("TEMP FILE NOT SAVED");
                logger.error(e);
              });
          }
        }, SEND_PAGE_CONTENT_INTERVAL);
      },
      async afterPageNavigation() {
        stopPushing = true;
      },
    },
  };

  return plugin;
};

function captureDOMHelper(page: Page, basePayload: Partial<PageClonePayload>) {
  return captureCurrentDOM(page)
    .then((dom) => {
      dom.window.document.head.insertAdjacentHTML("beforeend", injectHTML);

      return dom.serialize();
    })
    .then((content) => {
      return saveToCache({
        userId: basePayload.userId || "temp",
        url: basePayload.url || "",
        content,
      });
    });
}

export default GraphQLSubsPlugin;
