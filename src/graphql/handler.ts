import { createHandler } from "graphql-http/lib/use/express";
import { GraphQLSchemaGenerator } from "./schema";
import type { Builder } from "../types";
import type { Network } from "../network";
import type { Database } from "../database";
import type express from "express";

class GraphQLHandler {
  private schema: ReturnType<GraphQLSchemaGenerator["generateSchema"]> | null = null;

  constructor(private readonly builder: Builder, private readonly network: Network, private readonly database: Database) {}

  private async applyNetworkHandlers(res: express.Response): Promise<boolean> {
    if (this.network.offline()) {
      const { status, message } = this.network.state("offline");
      res.status(status).json({ errors: [{ message }] });
      return true;
    }

    await this.network.wait();

    if (this.network.timeout()) {
      return true;
    }

    if (this.network.error()) {
      const { status, message } = this.network.state("error");
      res.status(status).json({ errors: [{ message }] });
      return true;
    }
    return false;
  }

  private getSchema() {
    if (!this.schema) {
      const schemaGenerator = new GraphQLSchemaGenerator(this.builder);
      this.schema = schemaGenerator.generateSchema();
    }
    return this.schema;
  }

  createMiddleware() {
    const schema = this.getSchema();

    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (await this.applyNetworkHandlers(res)) {
        return;
      }

      const handler = createHandler({
        schema,
        context: () => ({
          database: this.database,
          network: this.network,
        }),
        formatError: (error) => {
          return error;
        },
      });

      return handler(req, res, next);
    };
  }
}

export { GraphQLHandler };
