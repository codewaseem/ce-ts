import { CEPlugin, BaseCEPlugin } from "../types";

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
    ...BaseCEPlugin,
    events: {
      ...BaseCEPlugin.events,
      async afterPageOpen(page) {
        await page.setViewport({
          width: Math.floor(width),
          height: Math.floor(height),
        });

        userAgent.length && (await page.setUserAgent(userAgent));
      },
    },
  };

  return plugin;
};

export default SetPageOptions;
