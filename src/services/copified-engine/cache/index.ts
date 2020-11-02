import redis from "redis";
import { promisify } from "util";
import fse from "fs-extra";
import config from "../../../config";
import { join } from "path";

const BASE_PATH = config.BASE_CLONED_PAGES_PATH;

const redisClient = redis.createClient({
  host: config.REDIS_HOST,
  port: 6379,
});

const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);

type Props = {
  userId: string;
  url: string;
  content: string;
};

type QueryProps = Pick<Props, "userId" | "url">;

function getSavePath(filename: string): string {
  return join(BASE_PATH, filename);
}

function getSaveKey({ userId, url }: QueryProps) {
  return `${userId}-${encodeURIComponent(url)}`;
}

export async function saveToCache({
  userId,
  url,
  content,
}: Props): Promise<string> {
  await removeFromCache({ userId, url });

  const filename = Date.now() + ".html";
  const key = getSaveKey({ userId, url });

  await set(key, filename);
  await fse.outputFile(getSavePath(filename), content);
  return `/cdn/${filename}`;
}

export async function retrieveFromCache({
  userId,
  url,
}: QueryProps): Promise<string> {
  const key = getSaveKey({ userId, url });
  const filename = await get(key);
  if (filename && filename.length) return `/cdn/${filename}`;

  return "";
}

export async function removeFromCache({
  userId,
  url,
}: QueryProps): Promise<void> {
  const key = getSaveKey({ userId, url });
  const filename = await get(key);

  if (filename && filename.length) {
    const path = getSavePath(filename);
    const pathExists = await fse.pathExists(path);
    pathExists && (await fse.unlink(path));
  }

  await set(key, "");
}

if (require.main == module)
  (async () => {
    const userId = "12";
    const url = "https://www.noon.com";

    await removeFromCache({ userId, url });

    console.log("fromCache", await retrieveFromCache({ userId, url }));

    console.log(
      await saveToCache({ userId, url, content: "<html>test</html>" })
    );

    console.log("fromCache", await retrieveFromCache({ userId, url }));
  })();
