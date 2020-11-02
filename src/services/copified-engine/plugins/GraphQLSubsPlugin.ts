import { Publisher } from "type-graphql";
import { PageClonePayload } from "../../../graphql/types";
import logger from "../../../utils/logger";
import { saveToCache } from "../cache";
import { BaseCEPlugin, CEPlugin } from "../types";
import { captureCurrentDOM } from "../utils";

const GraphQLSubsPlugin = (
  publish: Publisher<PageClonePayload>,
  basePayload: Partial<PageClonePayload>
): CEPlugin => {
  let totalRequests = 0;
  let completedRequests = 0;
  let stopPushing = false;
  let tempStaticURL = "";
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
        }, 3 * 1000);

        const timer = setInterval(async function cb() {
          if (stopPushing || page.isClosed()) {
            clearInterval(timer);
          } else {
            captureCurrentDOM(page)
              .then((dom) => dom.serialize())
              .then((content) => {
                return saveToCache({
                  userId: basePayload.userId || "temp",
                  url: basePayload.url || "",
                  content,
                });
              })
              .then((tempPath) => {
                logger.info(tempPath);
                tempStaticURL = tempPath;
                publishState();
              })
              .catch((e) => {
                logger.error("TEMP FILE NOT SAVED");
                logger.error(e);
              });
          }
        }, 10 * 1000);
      },
      async afterPageNavigation() {
        stopPushing = true;
      },
    },
  };

  return plugin;
};

export default GraphQLSubsPlugin;
