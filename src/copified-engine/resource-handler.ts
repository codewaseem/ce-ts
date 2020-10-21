import fse from "fs-extra";
import { join } from "path";
import config from "../config";
const basePath = config.BASE_CLONED_PAGES_PATH;

// const redisClient = redis.createClient({
//   host: "redis",
//   port: 6379,
// });

// const get = promisify(redisClient.get).bind(redisClient);
// const set = promisify(redisClient.set).bind(redisClient);
const cache: {
  [key: string]: number;
} = {};

const key = (userId: string, url: string) =>
  `${userId}:${encodeURIComponent(url)}`;

function getFilename(userId: string, url: string) {
  const id = key(userId, url);
  if (!cache[id]) {
    cache[id] = Date.now();
  }
  return cache[id] + ".html";
}

function getSavePath(userId: string, url: string) {
  return join(basePath, getFilename(userId, url));
}

export function getPageCDNPath(userId: string, url: string): string {
  return `/cdn/${getFilename(userId, url)}`;
}

export async function saveUserPage({
  url,
  userId,
  pageData,
}: {
  url: string;
  userId: string;
  pageData: string;
}): Promise<string> {
  const path = getSavePath(userId, url);
  await fse.outputFile(path, pageData);
  return path;
}

export async function isUserPageExists(
  userId: string,
  url: string
): Promise<boolean> {
  const path = getSavePath(userId, url);
  return await fse.pathExists(path);
}
