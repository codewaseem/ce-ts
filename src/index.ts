import { ApolloServer, gql } from "apollo-server-express";
import cors from "cors";
import express from "express";
import { join } from "path";
import puppeteer from "puppeteer-extra";
import "reflect-metadata";
import config from "./config";
import CopifiedEngine from "./copified-engine";
let copifiedEngine: CopifiedEngine;

const main = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const browserWSEndpoint = await browser.wsEndpoint();

  copifiedEngine = new CopifiedEngine(browserWSEndpoint);

  const app = buildExpressApp();

  await setupGraphQLServer(app);

  await startServer(app);
};

main();

function buildExpressApp() {
  const app = express();

  app.set("port", config.PORT);

  app.use(cors());

  app.use(express.static(join(process.cwd(), "public")));
  app.use(
    "/prerendere",
    express.static(join(process.cwd(), "public", "generated"))
  );

  return app;
}

const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    ssr(url: String!): String!
  }
`;

const resolvers = {
  Query: {
    ssr: (_: any, args: any) => {
      return copifiedEngine.ssr(args.url);
    },
  },
};

async function setupGraphQLServer(app: express.Express) {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  apolloServer.applyMiddleware({
    app,
  });
}

async function startServer(app: express.Express) {
  app.listen(app.get("port"), () => {
    console.log(`Server started at ${app.get("port")}`);
  });
}
