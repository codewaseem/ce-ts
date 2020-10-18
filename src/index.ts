import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import express from "express";
import { join } from "path";
import "reflect-metadata";
import config from "./config";
import { resolvers, typeDefs } from "./graphql";

const main = async () => {
  const app = express();

  app.set("port", config.PORT);

  app.use(cors());

  app.use(express.static(join(process.cwd(), "public")));

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    playground: true,
  });

  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: "*",
    },
  });

  app.listen(app.get("port"), () => {
    console.log(`Server started at ${app.get("port")}`);
  });
};

main();
