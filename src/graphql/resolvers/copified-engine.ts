import {
  Arg,
  Publisher,
  PubSub,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import { clonePageAPI } from "../../services/copified-engine/api";
import { GraphQLSubsPlugin } from "../../services/copified-engine/plugins";
import { PageCloneEvent, PageClonePayload, SsrArgs } from "../types";

const PAGE_CLONE_TOPIC = "PAGE_CLONE";

@Resolver()
export class CEResolver {
  @Subscription({
    topics: PAGE_CLONE_TOPIC,
    filter: ({ payload, args }) => payload.url == args.url,
  })
  pageCloneNotification(
    @Root() data: PageClonePayload,
    @Arg("url") url: string
  ): PageCloneEvent {
    return {
      ...data,
      time: new Date(),
    };
  }

  @Query(() => String)
  async clonePage(
    @Arg("inputData") inputData: SsrArgs,
    @PubSub(PAGE_CLONE_TOPIC) publish: Publisher<PageClonePayload>
  ): Promise<string> {
    return await clonePageAPI({
      url: inputData.url,
      userId: "12355",
      freshContent: inputData.options?.forceReload,
      pageViewport: inputData.options?.browserOptions,
      userAgent: inputData.options?.browserOptions?.userAgent,
      plugins: [
        GraphQLSubsPlugin(publish, {
          url: inputData.url,
          userId: "12355",
        }),
      ],
    });
  }
}
