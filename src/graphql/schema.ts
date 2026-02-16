/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  type GraphQLFieldConfigMap,
} from "graphql";
import type { Type } from "ts-morph";
import type { Builder } from "../types";

type GraphQLTypeMap = Map<string, GraphQLObjectType | GraphQLInputObjectType>;

class GraphQLSchemaGenerator {
  private typeMap: GraphQLTypeMap = new Map();

  constructor(private readonly builder: Builder) {}

  private tsTypeToGraphQLType(type: Type, isInput = false): any {
    if (type.isString()) return GraphQLString;
    if (type.isNumber()) return GraphQLFloat;
    if (type.isBoolean()) return GraphQLBoolean;
    if (type.isBigInt()) return GraphQLString;

    if (type.isArray()) {
      const elementType = type.getArrayElementTypeOrThrow();
      return new GraphQLList(this.tsTypeToGraphQLType(elementType, isInput));
    }

    if (type.isUnion()) {
      return GraphQLString;
    }
    // TODO tuples

    if (type.isObject()) {
      const typeName = this.getTypeName(type);
      if (!typeName) return GraphQLString;

      const existingType = this.typeMap.get(typeName);
      if (existingType) {
        return isInput && existingType instanceof GraphQLObjectType ? undefined : existingType;
      }

      const graphqlType = this.createObjectType(type, typeName, isInput);
      if (graphqlType) {
        this.typeMap.set(typeName, graphqlType);
        return graphqlType;
      }
    }

    return GraphQLString;
  }

  private getTypeName(type: Type): string | null {
    const symbol = type.getSymbol();
    if (symbol) {
      return symbol.getName();
    }
    return null;
  }

  private createObjectType(type: Type, typeName: string, isInput: boolean): GraphQLObjectType | GraphQLInputObjectType | null {
    const props = type.getProperties();
    const fields: GraphQLFieldConfigMap<any, any> = {};

    for (const prop of props) {
      const propType = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
      const graphqlType = this.tsTypeToGraphQLType(propType, isInput);

      if (graphqlType) {
        fields[prop.getName()] = {
          type: graphqlType,
        };
      }
    }

    if (Object.keys(fields).length === 0) {
      return null;
    }

    if (isInput) {
      return new GraphQLInputObjectType({
        name: `${typeName}Input`,
        fields: fields as GraphQLInputObjectType["_fields"],
      });
    }

    return new GraphQLObjectType({
      name: typeName,
      fields,
    });
  }

  generateSchema(): GraphQLSchema {
    const queryFields: GraphQLFieldConfigMap<any, any> = {};
    const mutationFields: GraphQLFieldConfigMap<any, any> = {};

    for (const [entityName, entity] of this.builder.entities) {
      const graphqlType = this.tsTypeToGraphQLType(entity.type);

      if (graphqlType instanceof GraphQLObjectType || graphqlType instanceof GraphQLList) {
        const listType = graphqlType instanceof GraphQLList ? graphqlType : new GraphQLList(graphqlType);
        queryFields[entityName] = {
          type: listType,
          args: {
            count: { type: GraphQLInt },
          },
          resolve: async (_, args: { count?: number }) => {
            const { data } = await this.builder.build(entityName.toLowerCase(), entity.type, { count: args.count || 1 });
            return Array.isArray(data) ? data : [data];
          },
        };

        queryFields[`${entityName}ById`] = {
          type: graphqlType instanceof GraphQLList ? graphqlType.ofType : graphqlType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLID) },
          },
          resolve: async (_, args: { id: string }, context) => {
            if (!context.database?.enabled()) {
              throw new Error("Database is not enabled");
            }
            await entity.table.read();
            const item = entity.table.data.find((item) => String((item as { id: string }).id) === args.id);
            return item || null;
          },
        };

        queryFields[`all${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`] = {
          type: new GraphQLList(graphqlType instanceof GraphQLList ? graphqlType.ofType : graphqlType),
          resolve: async (_, __, context) => {
            if (!context.database?.enabled()) {
              throw new Error("Database is not enabled");
            }
            await entity.table.read();
            return entity.table.data;
          },
        };

        const inputType = this.tsTypeToGraphQLType(entity.type, true);
        if (inputType instanceof GraphQLInputObjectType) {
          mutationFields[`create${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`] = {
            type: graphqlType instanceof GraphQLList ? graphqlType.ofType : graphqlType,
            args: {
              input: { type: new GraphQLNonNull(inputType) },
            },
            resolve: async (_, args: { input: { id: string } }, context) => {
              if (!context.database?.enabled()) {
                throw new Error("Database is not enabled");
              }
              await entity.table.read();
              const newItem = { ...args.input, id: args.input.id || `${Date.now()}-${Math.random()}` };
              await entity.table.update((items) => items.push(newItem));
              return newItem;
            },
          };
        }

        mutationFields[`delete${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`] = {
          type: GraphQLBoolean,
          args: {
            id: { type: new GraphQLNonNull(GraphQLID) },
          },
          resolve: async (_, args: { id: string }, context) => {
            if (!context.database?.enabled()) {
              throw new Error("Database is not enabled");
            }
            await entity.table.read();
            const index = entity.table.data.findIndex((item) => String((item as { id: string }).id) === args.id);
            if (index !== -1) {
              await entity.table.update((items) => items.splice(index, 1));
              return true;
            }
            return false;
          },
        };

        mutationFields[`flush${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`] = {
          type: GraphQLBoolean,
          resolve: async (_, __, context) => {
            if (!context.database?.enabled()) {
              throw new Error("Database is not enabled");
            }
            await entity.table.update((items) => (items.length = 0));
            return true;
          },
        };
      }
    }

    const QueryType = new GraphQLObjectType({
      name: "Query",
      fields: queryFields,
    });

    const MutationType = new GraphQLObjectType({
      name: "Mutation",
      fields: mutationFields,
    });

    return new GraphQLSchema({
      query: QueryType,
      mutation: Object.keys(mutationFields).length > 0 ? MutationType : undefined,
    });
  }
}

export { GraphQLSchemaGenerator };
