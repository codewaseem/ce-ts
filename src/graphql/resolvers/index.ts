import clonePage from "../../copified-engine";

type SSRArgs = {
  url: string;
  forceReload?: boolean;
};

const resolvers = {
  Query: {
    ssr: async (_: any, args: SSRArgs): Promise<string> => {
      return clonePage({
        ...args,
        userId: "12632", // extract userId from auth-token;
      });
    },
  },
};

export default resolvers;
