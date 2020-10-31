import config from "../../../config";
import { CEPlugin } from "../types";
import BasePlugin from "./BasePlugin";

const ProxyPlugin: CEPlugin = {
  ...(BasePlugin as CEPlugin),
  addBrowserLaunchFlags: async (flags) => {
    flags["--proxy-server"] = config.PROXY_SERVER;
  },
  addBrowserOptions: async (options) => {
    options.ignoreHTTPSErrors = true;
  },
  afterPageOpen: async (page) => {
    await page.authenticate({
      username: config.PROXY_SERVER_USERNAME,
      password: config.PROXY_SERVER_PASSWORD,
    });
  },
};

export default ProxyPlugin;
