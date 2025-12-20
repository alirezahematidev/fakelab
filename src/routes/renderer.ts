import express from "express";
import qs from "qs";
import type { IGenerated } from "../types";
import type { Config } from "../config/conf";

interface PackageJson {
  version: string;
}

class RouteRenderer {
  constructor(private readonly builder: IGenerated, private readonly config: Config, private readonly pkg: PackageJson) {}

  private async handleQueries(request: express.Request) {
    const count = request.query.count;

    if (count) return { count: count.toString() };

    return {};
  }

  index() {
    return (req: express.Request, res: express.Response) => {
      const currentPath = req.path;

      res.render("index", { currentPath, entities: this.builder.entities, version: this.pkg.version, enabled: this.config.databaseEnabled() });
    };
  }

  preview(prefix: string) {
    return async (req: express.Request, res: express.Response) => {
      const address = `${req.protocol}://${req.host}/`;
      const currentPath = req.path;

      const name = req.params.name;

      const queries = await this.handleQueries(req);

      const search = qs.stringify(queries, { addQueryPrefix: true });

      const entity = this.builder.entities.get(name.toLowerCase());

      if (entity) {
        const { json } = await this.builder.forge(entity.type, queries);
        const filepath = entity.filepath;

        res.render("preview", {
          name,
          filepath,
          currentPath,
          address,
          search,
          json,
          prefix,
          entities: this.builder.entities,
          version: this.pkg.version,
          enabled: this.config.databaseEnabled(),
        });
      } else res.redirect("/");
    };
  }

  database() {
    return (req: express.Request, res: express.Response) => {
      const currentPath = req.path;

      res.render("database", { currentPath, entities: this.builder.entities, version: this.pkg.version, enabled: this.config.databaseEnabled() });
    };
  }

  table(prefix: string) {
    return async (req: express.Request, res: express.Response) => {
      const address = `${req.protocol}://${req.host}/`;
      const currentPath = req.path;

      const name = req.params.name;

      const entity = this.builder.entities.get(name.toLowerCase());

      if (entity) {
        await entity.table.read();

        const json = JSON.stringify(entity.table.data, null, 2);

        const filepath = entity.filepath;

        const add = () => {
          entity.table.write();
        };

        res.render("table", {
          name,
          filepath,
          currentPath,
          address,
          prefix,
          json,
          add,
          entities: this.builder.entities,
          version: this.pkg.version,
          enabled: this.config.databaseEnabled(),
        });
      } else res.redirect("/database");
    };
  }
}

export { RouteRenderer };
