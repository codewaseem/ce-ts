/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import config from "../../../config";
import { CEPlugin, BaseCEPlugin } from "../types";

const ProxyPlugin: CEPlugin = {
  ...BaseCEPlugin,
  events: {
    ...BaseCEPlugin.events,
    async afterPageOpen(page) {
      await page.authenticate({
        username: config.PROXY_SERVER_USERNAME,
        password: config.PROXY_SERVER_PASSWORD,
      });
    },
  },
  methods: {
    ...BaseCEPlugin.methods,
    async addBrowserLaunchFlags(flags) {
      flags["--proxy-server"] = config.PROXY_SERVER;
    },
    async addBrowserOptions(options) {
      options.ignoreHTTPSErrors = true;
    },
  },
};

export default ProxyPlugin;
