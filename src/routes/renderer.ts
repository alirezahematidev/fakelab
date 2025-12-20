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
    return (_: express.Request, res: express.Response) => {
      res.render("index", { name: null, entities: this.builder.entities, version: this.pkg.version, enabled: this.config.databaseEnabled() });
    };
  }

  preview(prefix: string) {
    return async (req: express.Request, res: express.Response) => {
      const address = `${req.protocol}://${req.host}/`;

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
    return (_: express.Request, res: express.Response) => {
      const enabled = this.config.databaseEnabled();

      if (!enabled) res.redirect("/");
      else res.render("database", { name: null, entities: this.builder.entities, version: this.pkg.version });
    };
  }

  table(prefix: string) {
    return async (req: express.Request, res: express.Response) => {
      const address = `${req.protocol}://${req.host}/`;

      const name = req.params.name;

      const entity = this.builder.entities.get(name.toLowerCase());

      const enabled = this.config.databaseEnabled();

      if (!enabled) res.redirect("/");
      else {
        if (entity) {
          await entity.table.read();

          const hasData = entity.table.data.length > 0;

          const json = JSON.stringify(entity.table.data, null, 2);

          const filepath = entity.filepath;

          res.render("table", {
            name,
            filepath,
            address,
            prefix,
            json,
            hasData,
            entities: this.builder.entities,
            version: this.pkg.version,
          });
        } else res.redirect("/database");
      }
    };
  }
}

export { RouteRenderer };
