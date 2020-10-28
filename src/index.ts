import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import express from "express";
import { join } from "path";
import { buildSchema } from "type-graphql";
import config from "./config";
import { CopifiedEngineResolver } from "./graphql";

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
    resolvers: [CopifiedEngineResolver],
  });

  const apolloServer = new ApolloServer({
    schema,
    playground: true,
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(app.get("port"), () => {
    console.log(`Server started at ${app.get("port")}`);
  });
};

main();
