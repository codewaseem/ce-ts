import https from "https";
import config from "../../config";
import logger from "../../utils/logger";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getProxies(): Promise<{
  results: Array<{ proxy_address: string }>;
}> {
  return new Promise((resolve, reject) => {
    https.get(
      "https://proxy.webshare.io/api/proxy/list/",
      {
        headers: {
          Authorization: `Token ${config.WEBSHARE_API_KEY}`,
        },
      },
      (res) => {
        let result = "";
        res.on("data", (c) => (result += c));
        res.on("end", () => resolve(JSON.parse(result)));
        res.on("error", reject);
      }
    );
  });
}

export async function getRandomProxy(): Promise<string> {
  logger.info(config.WEBSHARE_API_KEY);

  const proxies = [
    "https://209.127.191.180:443",
    "https://45.94.47.66:443",
    "https://185.30.232.123:443",
    "https://45.95.96.132:443",
    "https://45.130.255.198:443",
    "https://45.95.96.237:443",
    "https://45.95.96.187:443",
    "https://193.8.56.119:443",
    "https://185.164.56.20:443",
    "https://45.130.255.243:443",
  ];

  console.log(proxies);

  return Promise.resolve(proxies[getRandomInt(proxies.length)]);
}
