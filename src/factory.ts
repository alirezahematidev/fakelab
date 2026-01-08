import { Type } from "ts-morph";
import { Generator } from "./generator";
import type { EvaluatedFakerArgs, ForgeOptions, Builder, ServerCLIOptions } from "./types";
import { ParserEngine } from "./parserEngine";
import type { Config } from "./config/conf";
import type { FakerLocale } from "./constants";
import { createFileCache } from "./cache";

async function factory(type: Type, generator: Generator, data: (EvaluatedFakerArgs | undefined)[] = [], index = 0): Promise<unknown> {
  if (type.isString()) return generator.string(data[index]);
  if (type.isNumber()) return generator.int(data[index]);
  if (type.isBoolean()) return generator.bool(data[index]);
  if (type.isBigInt()) return generator.bigInt(data[index]);
  if (type.isBooleanLiteral()) return generator.litbool(type.getText());
  if (type.isLiteral()) return type.getLiteralValue();
  if (type.isUndefined()) return undefined;

  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    return await generator.union(unionTypes.map((u, index) => factory(u, generator, data, index)));
  }

  if (type.isTuple()) {
    const tupleTypes = type.getTupleElements();
    return await generator.tuple(tupleTypes.map((u, index) => factory(u, generator, data, index)));
  }

  if (type.isIntersection()) {
    const intersectionTypes = type.getIntersectionTypes();
    return await generator.intersection(intersectionTypes.map((u) => factory(u, generator, data, index)));
  }

  if (type.isArray()) {
    const element = type.getArrayElementTypeOrThrow();
    return [await factory(element, generator, data, index)];
  }

  if (type.isObject()) {
    const props = type.getProperties();
    return await generator.object(props, (type, generator, tags) => factory(type, generator, tags, index));
  }

  return null;
}

function resolveBatch<T>({ each }: { each: () => Promise<T> }) {
  const resolve = async (length: number) => {
    return await Promise.all(Array.from({ length }, each));
  };

  return { resolve };
}

export async function prepareBuilder(config: Config, options: ServerCLIOptions, fresh: boolean): Promise<Builder> {
  const files = await config.files(options.source, fresh);

  const parser = await ParserEngine.init(files, config.getTSConfigFilePath(options.tsConfigPath));

  const entities = await parser.entities();

  const faker = await parser.initFakerLibrary(config.options.faker(options.locale as FakerLocale));

  const generator = new Generator(faker);

  const cache = createFileCache(config);

  async function build(name: string, type: Type, options: ForgeOptions) {
    const key = await parser.typeToString(type, { ...options, ...config.options.faker() });

    const cached = await cache.get(name, key);

    if (cached) {
      return { ...cached, fromCache: true };
    }

    const resolver = resolveBatch({ each: () => factory(type, generator) });

    const data = await (options.count ? resolver.resolve(parseInt(String(options.count))) : factory(type, generator));

    const json = JSON.stringify(data, null, 2);

    cache.set(name, key, json);

    return { data, json, fromCache: false };
  }

  return { entities, build };
}
