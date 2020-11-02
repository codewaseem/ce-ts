import { resolve } from "path";
import { BaseCEPlugin, CEPlugin } from "../types";

const ScrollPlugin: CEPlugin = {
  ...BaseCEPlugin,
  methods: {
    ...BaseCEPlugin.methods,
    async runPageScript(page): Promise<void> {
      await page.evaluate(async () => {
        const scrollDistance = 200;
        const scrollTimeout = 250;

        // scroll to bottom
        await new Promise((resolve) => {
          let totalHeight = 0;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, scrollDistance);
            totalHeight += scrollDistance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, scrollTimeout);
        });

        await Promise.allSettled(
          Array.from(document.getElementsByTagName("img"), (image) => {
            if (image.complete) {
              return;
            }

            return new Promise((resolve, reject) => {
              image.addEventListener("load", resolve);
              image.addEventListener("error", reject);
            });
          })
        );

        window.scrollTo(0, 0);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      });
    },
  },
};

export default ScrollPlugin;