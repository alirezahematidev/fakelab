import express from "express";
import fs from "fs-extra";
import path from "node:path";
import { prepareBuilder } from "./factory";
import type { ServerCLIOptions } from "./types";
import type { Config } from "./config/conf";
import { DIRNAME } from "./file";
import { RouteRenderer } from "./routes/renderer";
import { RouteHandler } from "./routes/handler";
import type { Network } from "./network";
import type { Database } from "./database";

const packageJson = fs.readJSONSync(path.join(DIRNAME, "../package.json"));

class RouteRegistry {
  private prefix: string;

  constructor(
    private readonly router: express.Router,
    private readonly config: Config,
    private readonly network: Network,
    private readonly database: Database,
    private readonly options: ServerCLIOptions
  ) {
    const { pathPrefix } = this.config.options.server(this.options.pathPrefix, this.options.port);
    this.prefix = pathPrefix;
  }

  async register() {
    const builder = await prepareBuilder(this.config, this.options);

    const renderer = new RouteRenderer(builder, this.database, packageJson);

    const handler = new RouteHandler(builder, this.network, this.database);

    // template renderers
    this.router.get("/", renderer.index());

    this.router.get("/entities/:name", renderer.preview(this.prefix));

    this.router.get("/database", renderer.db());

    this.router.get("/database/:name", renderer.table(this.prefix));

    // api handlers
    this.router.get(`/${this.prefix}/:name`, handler.entity());

    this.router.get(`/${this.prefix}/database/:name`, handler.getTable());

    this.router.post(`/${this.prefix}/database/:name`, handler.updateTable());

    this.router.post(`/${this.prefix}/database/insert/:name`, handler.insert());
    this.router.post(`/${this.prefix}/database/flush/:name`, handler.flush());

    // private
    this.router.post(`/__update/:name`, handler._update());
    this.router.post(`/__delete/:name`, handler._clear());
  }
}

export { RouteRegistry };
