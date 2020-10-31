import { CEPlugin } from "../types";
import BasePlugin from "./BasePlugin";

type PageOptions = Partial<{
  width: number;
  height: number;
  userAgent: string;
}>;

const SetPageOptions: (options: PageOptions) => CEPlugin = ({
  width = 1024,
  height = 800,
  userAgent = "",
}: PageOptions) => {
  const plugin: CEPlugin = {
    ...(BasePlugin as CEPlugin),
    afterPageOpen: async (page) => {
      await page.setViewport({
        width: Math.floor(width),
        height: Math.floor(height),
      });

      userAgent.length && (await page.setUserAgent(userAgent));
    },
  };

  return plugin;
};

export default SetPageOptions;
