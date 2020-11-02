import { DirectNavigationOptions } from "puppeteer";
import { retrieveFromCache, saveToCache } from "./cache";
import CopifiedEngine from "./engine";
import {
  CEEventPlugin,
  InjectToDomPlugin,
  PageOptionsPlugin,
  ProxyPlugin,
  ScrollPlugin,
  TimeTrackerPlugin,
  WaitForPlugin,
} from "./plugins";
import { CEPlugin } from "./types";

export interface ClonePageAPIProps {
  url: string;
  userId: string;
  plugins?: CEPlugin[];
  useProxy?: boolean;
  pageViewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  navigationOptions?: DirectNavigationOptions;
  freshContent?: boolean;
}

export async function clonePageAPI({
  url,
  userId,
  plugins: otherPlugins = [],
  useProxy,
  pageViewport,
  userAgent,
  navigationOptions,
  freshContent,
}: ClonePageAPIProps): Promise<string> {
  const cached = await retrieveFromCache({ userId, url });
  if (!freshContent && cached) {
    return cached;
  }

  const basePlugins: CEPlugin[] = [
    CEEventPlugin,
    InjectToDomPlugin,
    WaitForPlugin({
      waitUntil: "networkidle2",
      ...navigationOptions,
    }),
    ScrollPlugin,
  ];

  if (useProxy) basePlugins.push(ProxyPlugin);

  if (pageViewport?.width || pageViewport?.height || userAgent) {
    basePlugins.push(
      PageOptionsPlugin({
        height: pageViewport?.height,
        width: pageViewport?.width,
        userAgent,
      })
    );
  }

  const ce = new CopifiedEngine({
    url,
    // Keep time tracker plugin last to also tracker time taken by other plugins
    plugins: [...basePlugins, ...otherPlugins, TimeTrackerPlugin()],
  });

  const content = await ce.clone();

  const path = await saveToCache({ userId, url, content });

  return path;
}
