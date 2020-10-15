import dotenv from "dotenv";
import { join } from "path";

dotenv.config();

export default {
  PORT: Number(process.env.PORT) || 1338,
  BASE_CLONED_PAGES_PATH: join(process.cwd(), "public", "cdn"),
};
