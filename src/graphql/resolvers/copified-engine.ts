import {
  Publisher,
  PubSub,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import CopifiedEngine from "../../services/copified-engine";
import {
  CEEventPlugin,
  WaitForPlugin,
} from "../../services/copified-engine/plugins";
import GraphQLSubsPlugin from "../../services/copified-engine/plugins/GraphQLSubsPlugin";
import { PageCloneEvent, PageClonePayload } from "../types";

const PAGE_CLONE_TOPIC = "PAGE_CLONE";

@Resolver()
export class CEResolver {
  @Subscription({
    topics: PAGE_CLONE_TOPIC,
  })
  pageCloneNotification(@Root() data: PageClonePayload): PageCloneEvent {
    return {
      ...data,
      time: new Date(),
    };
  }

  @Query(() => String)
  async clonePage(
    @PubSub(PAGE_CLONE_TOPIC) publish: Publisher<PageClonePayload>
  ): Promise<string> {
    const ce = new CopifiedEngine({
      url: "https://www.noon.com",
      plugins: [
        CEEventPlugin,
        WaitForPlugin({
          waitUntil: "load",
        }),
        GraphQLSubsPlugin(publish, {
          url: `https://www.noon.com`,
          userId: "123",
        }),
      ],
    });

    const html = await ce.clone();

    console.log("html");

    return html.length.toString();
  }
}
