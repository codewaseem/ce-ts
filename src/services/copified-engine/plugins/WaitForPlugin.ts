import { DirectNavigationOptions } from "puppeteer";
import { BaseCEPlugin, CEPlugin } from "../types";

const WaitForPlugin: (
  options: DirectNavigationOptions & {
    defaultTimeout?: number;
  }
) => CEPlugin = (options) => {
  const plugin: CEPlugin = {
    ...BaseCEPlugin,
    events: {
      ...BaseCEPlugin.events,
      async afterPageOpen(page) {
        const timeout = options.defaultTimeout ?? 0;
        page.setDefaultTimeout(timeout);
      },
    },
    methods: {
      ...BaseCEPlugin.methods,
      async setPageNavigationOptions(prevOptions) {
        prevOptions.waitUntil = options.waitUntil;
      },
    },
  };

  return plugin;
};

export default WaitForPlugin;
