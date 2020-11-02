import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import express from "express";
import { join } from "path";
import { buildSchema } from "type-graphql";
import config from "./config";
import http from "http";
import { CEResolver } from "./graphql";

const main = async () => {
  const app = express();

  app.set("port", config.PORT);

  app.options("*", cors());
  app.use(
    cors({
      credentials: true,
    })
  );

  app.use(express.static(join(process.cwd(), "public")));

  const schema = await buildSchema({
    resolvers: [CEResolver],
  });

  const apolloServer = new ApolloServer({
    schema,
    context({ res }) {
      return {
        res,
      };
    },
    playground: true,
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  const httpServer = http.createServer(app);
  apolloServer.installSubscriptionHandlers(httpServer);

  httpServer
    .listen(app.get("port"), () => {
      console.log(`Server started at ${app.get("port")}`);
    })
    .setTimeout(5 * 60 * 1000); // set timeout for 5 minutes
};

main();
