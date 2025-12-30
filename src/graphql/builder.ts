import { createHandler } from "graphql-http/lib/use/express";
import { GraphQLSchemaGenerator } from "./schema";
import type { Builder } from "../types";
import type { Network } from "../network";
import type { Database } from "../database";
import type express from "express";
import type { Type } from "ts-morph";

class GraphQLBuilder {
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

  buildQuery(entityName: string, entityType: Type): string {
    const fields = this.extractFields(entityType, new Set(), 1);
    return `query {\n  ${entityName}(count: 1) {\n${fields.join("\n")}\n  }\n}`;
  }

  private extractFields(type: Type, visited: Set<string> = new Set(), indent: number = 0): string[] {
    const fields: string[] = [];
    const typeName = type.getSymbol()?.getName();

    if (typeName && visited.has(typeName)) {
      return fields;
    }

    if (typeName) {
      visited.add(typeName);
    }

    const props = type.getProperties();
    const indentStr = "  ".repeat(indent);

    for (const prop of props) {
      const propType = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
      const propName = prop.getName();

      if (propType.isArray()) {
        const elementType = propType.getArrayElementTypeOrThrow();
        if (elementType.isObject() && !visited.has(elementType.getSymbol()?.getName() || "")) {
          const nestedFields = this.extractFields(elementType, visited, indent + 1);
          if (nestedFields.length > 0) {
            fields.push(`${propName} {\n${nestedFields.join("\n")}\n${indentStr}}`);
          } else {
            fields.push(`${indentStr}${propName}`);
          }
        } else {
          fields.push(`${indentStr}${propName}`);
        }
      } else if (propType.isObject() && !visited.has(propType.getSymbol()?.getName() || "")) {
        const nestedFields = this.extractFields(propType, visited, indent + 1);
        if (nestedFields.length > 0) {
          fields.push(`${propName} {\n${nestedFields.join("\n")}\n${indentStr}}`);
        } else {
          fields.push(`${indentStr}${indentStr}${propName}`);
        }
      } else {
        fields.push(`${indentStr}${indentStr}${propName}`);
      }
    }

    if (typeName) {
      visited.delete(typeName);
    }

    return fields;
  }
}

export { GraphQLBuilder };
