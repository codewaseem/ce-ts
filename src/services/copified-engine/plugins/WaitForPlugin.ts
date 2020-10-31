import { CEPlugin } from "../types";
import BasePlugin from "./BasePlugin";

const WaitForPlugin: () => CEPlugin = () => {
  const plugin: CEPlugin = {
    ...(BasePlugin as CEPlugin),
    async setPageNavigationOptions(options) {
      options.waitUntil = "networkidle2";
    },
  };

  return plugin;
};

export default WaitForPlugin;
