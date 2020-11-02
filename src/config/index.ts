import dotenv from "dotenv";
import { join } from "path";

dotenv.config();

export default {
  PORT: Number(process.env.PORT) || 1338,
  USE_LOCAL_CHROME: Boolean(Number(process.env.USE_LOCAL_CHROME)),
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  BASE_CLONED_PAGES_PATH: join(process.cwd(), "public", "cdn"),
  WEBSHARE_API_KEY: process.env.WEBSHARE_API_KEY || "",
  PROXY_SERVER: process.env.PROXY_SERVER || "",
  PROXY_SERVER_USERNAME: process.env.PROXY_SERVER_USERNAME || "",
  PROXY_SERVER_PASSWORD: process.env.PROXY_SERVER_PASSWORD || "",
};
