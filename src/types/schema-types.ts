import { Field, InputType } from "type-graphql";

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
