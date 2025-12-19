import express from "express";
import fs from "fs-extra";
import path from "node:path";
import qs from "qs";
import { fileURLToPath } from "node:url";
import { generate } from "./factory";
import type { ServerCLIOptions } from "./types";
import type { Config } from "./config/conf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = fs.readJSONSync(path.join(__dirname, "../package.json"));

class RouteRegistry {
  private prefix: string;

  constructor(private readonly router: express.Router, private readonly config: Config, private readonly opts: ServerCLIOptions) {
    const { pathPrefix } = this.config.serverOpts(this.opts.pathPrefix, this.opts.port);
    this.prefix = pathPrefix;
  }

  private async handleQueries(request: express.Request) {
    const count = request.query.count;

    if (count) return { count: count.toString() };

    return {};
  }

  async register() {
    const { entities, forge } = await generate(this.config, this.opts);

    this.router.get("/", (req, res) => {
      const currentPath = req.path;

      res.render("index", { currentPath, entities, version: pkg.version });
    });

    this.router.get("/:name", async (req, res) => {
      const address = `${req.protocol}://${req.host}/`;
      const currentPath = req.path;

      const name = req.params.name;

      const queries = await this.handleQueries(req);

      const search = qs.stringify(queries, { addQueryPrefix: true });

      const entity = entities.get(name.toLowerCase());

      if (entity) {
        const { json } = await forge(entity.type, queries);
        const filepath = entity.filepath;

        res.render("preview", { name, filepath, currentPath, address, search, json, entities, version: pkg.version, prefix: this.prefix });
      } else res.redirect("/");
    });

    this.router.get(`/${this.prefix}/:name`, async (req, res) => {
      try {
        const name = req.params.name;

        const queries = await this.handleQueries(req);

        const entity = entities.get(name.toLowerCase());

        if (entity) {
          const { data } = await forge(entity.type, queries);

          res.status(200).json(data);
        } else {
          res.status(400).json({ message: "The requested interface is not found" });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    });

    this.router.get(`/${this.prefix}/database/:name`, async (req, res) => {
      try {
        const name = req.params.name;

        const entity = entities.get(name.toLowerCase());

        if (entity) {
          await entity.table.read();
          res.status(200).json(entity.table.data);
        } else {
          res.status(400).json({ message: "Database is not found" });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    });

    this.router.post(`/${this.prefix}/database/:name`, async (req, res) => {
      try {
        const name = req.params.name;

        const queries = await this.handleQueries(req);

        const entity = entities.get(name.toLowerCase());

        if (entity) {
          const { data } = await forge(entity.type, queries);

          await entity.table.update((items) => items.push(data));

          res.status(200);
        } else {
          res.status(400).json({ message: "The mutated db is not found" });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    });
  }
}

export { RouteRegistry };
