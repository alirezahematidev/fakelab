import express from "express";
import qs from "qs";
import type { Builder } from "../types";
import type { Database } from "../database";
import type { Config } from "../config/conf";
import type { GraphQLBuilder } from "../graphql/builder";

interface PackageJson {
  version: string;
}

class RouteRenderer {
  constructor(
    private readonly builder: Builder,
    private readonly database: Database,
    private readonly config: Config,
    private readonly graphqlBuilder: GraphQLBuilder,
    private readonly pkg: PackageJson
  ) {}

  private async handleQueries(request: express.Request) {
    const count = request.query.count;

    if (count) return { count: count.toString() };

    return {};
  }

  index() {
    return (_: express.Request, res: express.Response) => {
      res.render("index", { name: null, entities: this.builder.entities, version: this.pkg.version, dbEnabled: this.database.enabled() });
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
        const { json } = await this.builder.build(entity.type, queries);
        const filepath = entity.filepath;

        res.render("preview", {
          name,
          suffix: entity.snapshot ? "(snapshot)" : "",
          filepath,
          address,
          search,
          json,
          prefix,
          entities: this.builder.entities,
          version: this.pkg.version,
          dbEnabled: this.database.enabled(),
          graphqlEnabled: this.config.options.graphql().enabled,
        });
      } else res.redirect("/");
    };
  }

  db() {
    return (_: express.Request, res: express.Response) => {
      const enabled = this.database.enabled();

      if (!enabled) res.redirect("/");
      else res.render("database", { name: null, entities: this.builder.entities, version: this.pkg.version });
    };
  }

  table(prefix: string) {
    return async (req: express.Request, res: express.Response) => {
      const address = `${req.protocol}://${req.host}/`;

      const name = req.params.name;

      const entity = this.builder.entities.get(name.toLowerCase());

      const enabled = this.database.enabled();

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

  graphql(prefix: string) {
    return (_: express.Request, res: express.Response) => {
      const { enabled } = this.config.options.graphql();

      if (!enabled) res.redirect("/");
      else
        res.render("graphql", {
          name: null,
          address: "",
          prefix,
          query: "",
          entities: this.builder.entities,
          version: this.pkg.version,
          dbEnabled: this.database.enabled(),
        });
    };
  }

  graphqlEntity(prefix: string) {
    return (req: express.Request, res: express.Response) => {
      const address = `${req.protocol}://${req.host}/`;
      const name = req.params.name;

      const entity = this.builder.entities.get(name.toLowerCase());

      const { enabled } = this.config.options.graphql();

      if (!enabled) res.redirect("/");
      else {
        if (entity) {
          const graphqlQuery = this.graphqlBuilder.buildQuery(name.toLowerCase(), entity.type);

          res.render("graphql", {
            name,
            address,
            prefix,
            query: graphqlQuery,
            entities: this.builder.entities,
            version: this.pkg.version,
            dbEnabled: this.database.enabled(),
          });
        } else res.redirect("/graphql");
      }
    };
  }
}

export { RouteRenderer };
