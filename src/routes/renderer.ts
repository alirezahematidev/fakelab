import express from "express";
import qs from "qs";
import type { Builder } from "../types";
import type { Database } from "../database";
import type { Config } from "../config/config";
import type { GraphQLBuilder } from "../graphql/builder";

interface PackageJson {
  version: string;
}

class RouteRenderer {
  private isFakelabEnabled: boolean;
  private isDatabaseEnabled: boolean;

  constructor(
    private readonly builder: Builder,
    private readonly database: Database,
    private readonly config: Config,
    private readonly graphqlBuilder: GraphQLBuilder,
    private readonly pkg: PackageJson
  ) {
    this.isFakelabEnabled = this.config.enabled();
    this.isDatabaseEnabled = this.database.enabled();
  }

  private async handleQueries(request: express.Request) {
    const count = request.query.count;

    if (count) return { count: count.toString() };

    return {};
  }

  index() {
    return (_: express.Request, res: express.Response) => {
      res.render("index", {
        name: null,
        entities: this.builder.entities,
        version: this.pkg.version,
        isFakelabEnabled: this.isFakelabEnabled,
        isDatabaseEnabled: this.isDatabaseEnabled,
      });
    };
  }

  preview(prefix: string) {
    return async (req: express.Request, res: express.Response) => {
      if (!this.isFakelabEnabled) return res.redirect("/");

      const address = `${req.protocol}://${req.host}/`;

      const name = req.params.name;

      const queries = await this.handleQueries(req);

      const search = qs.stringify(queries, { addQueryPrefix: true });

      const entity = this.builder.entities.get(name.toLowerCase());

      if (entity) {
        const { json, fromCache } = await this.builder.build(name.toLowerCase(), entity.type, queries);
        const filepath = entity.filepath;

        const graphqlOptions = this.config.options.graphQL();

        res.render("preview", {
          name,
          suffix: entity.snapshot ? "(snapshot)" : "",
          filepath,
          address,
          search,
          json,
          prefix,
          fromCache,
          entities: this.builder.entities,
          version: this.pkg.version,
          isDatabaseEnabled: this.isDatabaseEnabled,
          isFakelabEnabled: this.isFakelabEnabled,
          isGraphqlEnabled: graphqlOptions.enabled,
        });
      } else res.redirect("/");
    };
  }

  db() {
    return (_: express.Request, res: express.Response) => {
      if (!this.isFakelabEnabled) return res.redirect("/");

      const enabled = this.isDatabaseEnabled;

      if (!enabled) res.redirect("/");
      else res.render("database", { name: null, entities: this.builder.entities, version: this.pkg.version });
    };
  }

  table(prefix: string) {
    return async (req: express.Request, res: express.Response) => {
      if (!this.isFakelabEnabled) return res.redirect("/");

      const address = `${req.protocol}://${req.host}/`;

      const name = req.params.name;

      const entity = this.builder.entities.get(name.toLowerCase());

      const enabled = this.isDatabaseEnabled;

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
            isFakelabEnabled: this.isFakelabEnabled,
          });
        } else res.redirect("/database");
      }
    };
  }

  graphql(prefix: string) {
    return (_: express.Request, res: express.Response) => {
      if (!this.isFakelabEnabled) return res.redirect("/");

      const { enabled } = this.config.options.graphQL();

      if (!enabled) res.redirect("/");
      else
        res.render("graphql", {
          name: null,
          address: "",
          prefix,
          query: "",
          entities: this.builder.entities,
          version: this.pkg.version,
          isDatabaseEnabled: this.isDatabaseEnabled,
          isFakelabEnabled: this.isFakelabEnabled,
        });
    };
  }

  graphqlEntity(prefix: string) {
    return (req: express.Request, res: express.Response) => {
      if (!this.isFakelabEnabled) return res.redirect("/");

      const address = `${req.protocol}://${req.host}/`;
      const name = req.params.name;

      const entity = this.builder.entities.get(name.toLowerCase());

      const { enabled } = this.config.options.graphQL();

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
            isDatabaseEnabled: this.isDatabaseEnabled,
            isFakelabEnabled: this.isFakelabEnabled,
          });
        } else res.redirect("/graphql");
      }
    };
  }
}

export { RouteRenderer };
