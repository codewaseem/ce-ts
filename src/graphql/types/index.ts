import { ObjectType, Field } from "type-graphql";

export interface PageClonePayload {
  url: string;
  status: string;
  userId: string;
  staticURL: string;
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
