/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { EventEmitter } from "events";
import { JSDOM } from "jsdom";
import logger from "../../../utils/logger";
import { BaseCEPlugin, CEPlugin, CEEvents } from "../types";

class CEEvent extends EventEmitter {
  eventNames() {
    return Object.keys(BaseCEPlugin.events) as CEEvents[];
  }
}

export const ceEvent = new CEEvent({});

export const CEEventPlugin: CEPlugin = {
  ...BaseCEPlugin,
  events: {
    ...BaseCEPlugin.events,

    async onStart() {
      ceEvent.emit(`onStart`);
    },
    async onFinish() {
      ceEvent.emit(`onFinish`);
    },
    async beforeBrowserOpen() {
      ceEvent.emit("beforeBrowserOpen");
    },
    async afterBrowserOpen(browser) {
      ceEvent.emit("afterBrowserOpen", browser);
    },
    async beforePageOpen(browser) {
      ceEvent.emit("beforePageOpen", browser);
    },
    async afterPageOpen(page) {
      ceEvent.emit("afterPageOpen", page);
    },
    async beforePageNavigation(page) {
      ceEvent.emit("beforePageNavigation", page);
    },
    async afterPageNavigation(page) {
      ceEvent.emit("afterPageNavigation", page);
    },
    async beforeRunPageScript(page) {
      ceEvent.emit("beforeRunPageScript", page);
    },
    async afterRunPageScript(page) {
      ceEvent.emit("afterRunPageScript", page);
    },
    async beforePageCapture(page) {
      ceEvent.emit("beforePageCapture", page);
    },
    async afterPageCapture(page, htmlDoc) {
      ceEvent.emit("afterPageCapture", page, htmlDoc);
    },
  },
};
