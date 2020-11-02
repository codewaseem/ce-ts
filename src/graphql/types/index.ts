import { ObjectType, Field, InputType } from "type-graphql";

export interface PageClonePayload {
  url: string;
  status: string;
  userId: string;
  staticURL: string;
  tempStaticURL: string;
  totalRequests?: number;
  completedRequests?: number;
}

@ObjectType()
export class PageCloneEvent {
  @Field(() => String)
  url!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  staticURL!: string;

  @Field(() => String, { nullable: true })
  tempStaticURL?: string;

  @Field(() => Date)
  time!: Date;

  @Field(() => Number, {
    nullable: true,
  })
  totalRequests?: number;

  @Field(() => Number, {
    nullable: true,
  })
  completedRequests?: number;
}

@InputType()
export class BrowserOptions {
  @Field(() => Number, { defaultValue: 800 })
  width!: number;

  @Field(() => Number, { defaultValue: 600 })
  height!: number;

  @Field(() => String, { nullable: true })
  userAgent!: string;
}

@InputType()
export class SsrOptions {
  @Field(() => Boolean, { defaultValue: false })
  forceReload!: boolean;

  @Field(() => BrowserOptions, { nullable: true })
  browserOptions?: BrowserOptions;
}

@InputType()
export class SsrArgs {
  @Field(() => String)
  url!: string;

  @Field(() => SsrOptions, { nullable: true })
  options?: SsrOptions;
}
