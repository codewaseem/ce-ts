import fs from "fs";
import { join } from "path";
export { default as resolvers } from "./resolvers";

export const typeDefs = fs
  .readFileSync(join(__dirname, `schema.graphql`))
  .toLocaleString();
