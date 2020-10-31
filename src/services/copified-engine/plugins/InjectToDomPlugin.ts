/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { BaseCEPlugin, CEPlugin } from "../types";
import fse from "fs-extra";
import { join } from "path";

const injectHTML = fse
  .readFileSync(join(__dirname, "../../../assets", "inject.html"))
  .toString();

const InjectToDomPlugin: CEPlugin = {
  events: {
    ...BaseCEPlugin.events,
    async afterPageCapture(_page, htmlDoc) {
      htmlDoc.window.document.head.insertAdjacentHTML("beforeend", injectHTML);
      htmlDoc.window.document
        .querySelectorAll("iframe[src^=cid]")
        .forEach((frame) => frame.remove());
    },
  },
  methods: BaseCEPlugin.methods,
};

export default InjectToDomPlugin;
