import express from "express";
import fs from "fs-extra";
import path from "node:path";
import { generate } from "./factory";
import type { ServerCLIOptions } from "./types";
import type { Config } from "./config/conf";
import { DIRNAME } from "./file";
import { RouteRenderer } from "./routes/renderer";
import { RouteHandler } from "./routes/handler";

const packageJson = fs.readJSONSync(path.join(DIRNAME, "../package.json"));

class RouteRegistry {
  private prefix: string;

  constructor(private readonly router: express.Router, private readonly config: Config, private readonly opts: ServerCLIOptions) {
    const { pathPrefix } = this.config.serverOpts(this.opts.pathPrefix, this.opts.port);
    this.prefix = pathPrefix;
  }

  async register() {
    const builder = await generate(this.config, this.opts);

    const renderer = new RouteRenderer(builder, this.config, packageJson);

    const handler = new RouteHandler(builder);

    // template renderers
    this.router.get("/", renderer.index());

    this.router.get("/entities/:name", renderer.preview(this.prefix));

    this.router.get("/database", renderer.database());

    this.router.get("/database/:name", renderer.table(this.prefix));

    // api handlers
    this.router.get(`/${this.prefix}/:name`, handler.entity());

    this.router.get(`/${this.prefix}/database/:name`, handler.getTable());

    this.router.post(`/${this.prefix}/database/:name`, handler.mutateTable());

    // private
    this.router.post(`/__database/:name`, handler.addRecord());
  }
}

export { RouteRegistry };
