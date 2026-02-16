import express from "express";
import fs from "fs-extra";
import path from "node:path";
import { prepareBuilder } from "./factory";
import { GraphQLBuilder } from "./graphql/builder";
import { RouteRenderer } from "./routes/renderer";
import { RouteHandler } from "./routes/handler";
import type { Network } from "./network";
import type { Database } from "./database";
import type { Config } from "./config/config";
import type { Builder, ServerCLIOptions } from "./types";
import { Logger } from "./logger";
import { fileURLToPath } from "node:url";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

const packageJson = fs.readJSONSync(path.join(DIRNAME, "../package.json"));

class RouteRegistry {
  constructor(
    private readonly router: express.Router,
    private readonly config: Config,
    private readonly network: Network,
    private readonly database: Database,
    private readonly options: ServerCLIOptions
  ) {}

  private instantiateRegistryHandlers(config: Config, builder: Builder) {
    const gql = new GraphQLBuilder(builder, this.network, this.database, config);

    const handler = new RouteHandler(builder, this.network, this.database, config);

    const renderer = new RouteRenderer(builder, this.database, config, gql, packageJson);

    return { gql, handler, renderer };
  }

  async register() {
    Logger.info("Version %s", packageJson.version);
    const builder = await prepareBuilder(this.config, this.options);

    const { gql, handler, renderer } = this.instantiateRegistryHandlers(this.config, builder);

    const { pathPrefix } = this.config.options.server(this.options.pathPrefix, this.options.port);
    // template renderers
    this.router.get("/", renderer.index());

    this.router.get("/graphql", renderer.graphql(pathPrefix));
    this.router.get("/graphql/:name", renderer.graphqlEntity(pathPrefix));

    this.router.get("/entities/:name", renderer.preview(pathPrefix));

    this.router.get("/database", renderer.db());

    this.router.get("/database/:name", renderer.table(pathPrefix));

    this.router.get("/faker-cheatsheet", renderer.fakerDocs());

    this.router.all(`/${pathPrefix}/graphql`, gql.createMiddleware());

    // api handlers
    this.router.get(`/${pathPrefix}/:name`, handler.entity());

    this.router.get(`/${pathPrefix}/database/:name`, handler.getData());

    this.router.post(`/${pathPrefix}/database/:name`, handler.setData());

    this.router.post(`/${pathPrefix}/database/insert/:name`, handler.insert());

    this.router.post(`/${pathPrefix}/database/flush/:name`, handler.flush());

    this.router.post(`/${pathPrefix}/cache/reset/:name`, handler.reset());

    // private
    this.router.post(`/__update/:name`, handler._update());
    this.router.post(`/__delete/:name`, handler._clear());
    this.router.post(`/__resetCache/:name`, handler.__resetCache());
  }
}

export { RouteRegistry };
