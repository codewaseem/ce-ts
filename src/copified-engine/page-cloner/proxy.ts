function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

export function getRandomProxy(): Promise<string> {
  const proxies = [
    `https://182.237.16.7:443`,
    `https://199.231.240.25:443`,
    `https://64.235.204.107:443`,
  ];
  return Promise.resolve(proxies[getRandomInt(proxies.length)]);
}
