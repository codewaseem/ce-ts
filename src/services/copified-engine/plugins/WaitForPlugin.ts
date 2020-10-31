import { DirectNavigationOptions } from "puppeteer";
import { CEPlugin } from "../types";
import BasePlugin from "./BasePlugin";

const WaitForPlugin: (
  options: DirectNavigationOptions & {
    defaultTimeout?: number;
  }
) => CEPlugin = (options) => {
  const plugin: CEPlugin = {
    ...(BasePlugin as CEPlugin),
    async afterPageOpen(page) {
      const timeout = options.defaultTimeout ?? 0;
      console.log(timeout);
      page.setDefaultTimeout(timeout);
    },
    async setPageNavigationOptions(prevOptions) {
      prevOptions.waitUntil = options.waitUntil;
    },
  };

  return plugin;
};

export default WaitForPlugin;
