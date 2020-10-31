import logger from "../../../utils/logger";
import { CEPlugin, BaseCEPlugin } from "../types";

const TimeTrackerPlugin: () => CEPlugin = () => {
  let startedAt = 0;
  let totalTime = 0;

  const logMessage = (action = "") => {
    const timeTaken = Date.now() - startedAt;
    logger.info(`took ${timeTaken}ms for ${action}`);
  };

  const plugin: CEPlugin = {
    ...BaseCEPlugin,
    events: {
      ...BaseCEPlugin.events,

      async onStart() {
        totalTime = Date.now();
      },

      async onFinish() {
        totalTime = Date.now() - totalTime;
        logger.info(`total time ${totalTime}ms`);
      },

      async beforeBrowserOpen() {
        startedAt = Date.now();
      },
      async afterBrowserOpen() {
        logMessage(`opening the browser`);
      },
      async beforePageOpen() {
        startedAt = Date.now();
      },
      async afterPageOpen() {
        logMessage(`opening the page`);
      },
      async beforePageNavigation() {
        startedAt = Date.now();
      },
      async afterPageNavigation(page) {
        logMessage(`navigating to ${page.url()}`);
      },
      async beforeRunPageScript() {
        startedAt = Date.now();
      },
      async afterRunPageScript() {
        logMessage(`executing page scripts`);
      },
      async beforePageCapture() {
        startedAt = Date.now();
      },
      async afterPageCapture() {
        logMessage(`capturing page snapshot`);
      },
    },
  };

  return plugin;
};

export default TimeTrackerPlugin;
