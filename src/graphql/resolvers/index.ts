import { Arg, Query, Resolver } from "type-graphql";
import clonePage from "../../copified-engine";
import { SsrArgs } from "../../types/schema-types";

@Resolver()
export class CopifiedEngineResolver {
  @Query(() => String)
  async ssr(@Arg("inputData") inputData: SsrArgs): Promise<string> {
    return clonePage({
      ...inputData,
      userId: "12632", // extract userId from auth-token;
    });
  }
}
