import { CEPlugin } from "../types";
import BasePlugin from "./BasePlugin";
import fse from "fs-extra";
import { join } from "path";

const injectHTML = fse
  .readFileSync(join(__dirname, "../../../assets", "inject.html"))
  .toString();

const InjectToDomPlugin: CEPlugin = {
  ...BasePlugin,
  async afterPageCapture(page, htmlDoc) {
    htmlDoc.window.document.head.insertAdjacentHTML("beforeend", injectHTML);
    htmlDoc.window.document
      .querySelectorAll("iframe[src^=cid]")
      .forEach((frame) => frame.remove());
  },
};

export default InjectToDomPlugin;
