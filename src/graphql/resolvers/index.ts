import getCloneFunction from "../../copified-engine";

const resolvers = {
  Query: {
    ssr: async (_: any, args: { url: string }): Promise<string> => {
      const clone = await getCloneFunction();
      return clone("123", args.url);
    },
  },
};

export default resolvers;
