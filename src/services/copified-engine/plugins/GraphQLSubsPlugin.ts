import { Publisher } from "type-graphql";
import { PageClonePayload } from "../../../graphql/types";
import { BaseCEPlugin, CEPlugin } from "../types";
import { captureCurrentDOM } from "../utils";

const GraphQLSubsPlugin = (
  publish: Publisher<PageClonePayload>,
  basePayload: Partial<PageClonePayload>
): CEPlugin => {
  let totalRequests = 0;
  let completedRequests = 0;
  let stopTemp = false;
  let data = "";

  const plugin: CEPlugin = {
    ...BaseCEPlugin,
    events: {
      ...BaseCEPlugin.events,
      async onStart() {
        publish({
          ...(basePayload as PageClonePayload),
          status: "started",
          completedRequests,
          totalRequests,
        });
      },
      async onFinish() {
        publish({
          ...(basePayload as PageClonePayload),
          status: "finished",
          completedRequests,
          totalRequests,
        });
      },
      async beforePageNavigation(page) {
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          totalRequests++;
          request.continue();
          publish({
            ...(basePayload as PageClonePayload),
            status: "loading page",
            totalRequests,
            completedRequests,
          });
        });

        page.on("requestfinished", () => {
          completedRequests++;
          publish({
            ...(basePayload as PageClonePayload),
            status: "loading page",
            totalRequests,
            completedRequests,
          });
        });

        setTimeout(async function cb() {
          if (!stopTemp && !page.isClosed()) {
            data = await (await captureCurrentDOM(page)).serialize();
            console.log(data.length);
            setTimeout(cb, 5 * 1000);
          }
          return;
        }, 5 * 1000);
      },
      async afterPageNavigation() {
        stopTemp = true;
      },
    },
  };

  return plugin;
};

export default GraphQLSubsPlugin;
