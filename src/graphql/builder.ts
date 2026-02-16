import { createHandler } from "graphql-http/lib/use/express";
import { GraphQLSchemaGenerator } from "./schema";
import type { Builder } from "../types";
import type { Network } from "../network";
import type { Database } from "../database";
import type express from "express";
import type { Type } from "ts-morph";
import type { Config } from "../config/config";

class GraphQLBuilder {
  private schema: ReturnType<GraphQLSchemaGenerator["generateSchema"]> | null = null;

  constructor(private readonly builder: Builder, private readonly network: Network, private readonly database: Database, private readonly config: Config) {}

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
      if (!this.config.enabled) {
        return;
      }

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
    return `query {\n${entityName}(count: 1) {\n${fields.join("\n")}\n  }\n}`;
  }

  private unwrapListElements(t: Type): Type | null {
    if (t.isArray()) return t.getArrayElementTypeOrThrow();
    if (t.isTuple()) {
      const tupleElements = t.getTupleElements();

      const objectElement = tupleElements.find((element) => element.isObject());

      return objectElement ?? tupleElements[0] ?? null;
    }
    return null;
  }

  private extractFields(type: Type, visited: Set<string> = new Set(), indent: number = 1): string[] {
    const fields: string[] = [];
    const typeName = type.getSymbol()?.getName();

    if (typeName && visited.has(typeName)) {
      return fields;
    }

    if (typeName) {
      visited.add(typeName);
    }

    const props = type.getProperties();
    const gap = "  ".repeat(indent);

    for (const prop of props) {
      const propType = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
      const propName = prop.getName();

      const listElements = this.unwrapListElements(propType);

      if (listElements) {
        const elementName = listElements.getSymbol()?.getName() || "";

        if (listElements.isObject() && !visited.has(elementName)) {
          const nestedFields = this.extractFields(listElements, visited, indent + 1);
          if (nestedFields.length > 0) {
            fields.push(`${gap}${gap}${propName} {\n${nestedFields.join("\n")}\n${gap}}`);
          } else {
            fields.push(`${gap}${gap}${propName}`);
          }
        } else {
          fields.push(`${gap}${gap}${propName}`);
        }
        continue;
      }
      const symName = propType.getSymbol()?.getName() || "";

      if (propType.isObject() && !visited.has(symName)) {
        const nestedFields = this.extractFields(propType, visited, indent + 1);
        if (nestedFields.length > 0) {
          fields.push(`${gap}${gap}${propName} {\n${nestedFields.join("\n")}\n${gap}${gap}}`);
        } else {
          fields.push(`${gap}${gap}${propName}`);
        }
      } else {
        fields.push(`${gap}${gap}${propName}`);
      }
    }

    if (typeName) {
      visited.delete(typeName);
    }

    return fields;
  }
}

export { GraphQLBuilder };
