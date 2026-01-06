import path from "node:path";
import fs from "fs-extra";
import { Type, Symbol } from "ts-morph";
import { ParserEngine } from "../parserEngine";
import { DIRNAME } from "../file";
import { transform } from "esbuild";
import type { Config } from "../config/conf";
import { Logger } from "../logger";
import { HEADLESS_SOURCE } from "./template";

export class Headless {
  private readonly HEADLESS_FILENAME = "runtime.js";

  private JSDOC_FAKER_FIELD = "faker";
  private FAKER_TAG_REGEX = /^([a-zA-Z0-9._]+)(?:\((.*)\))?$/;

  constructor(private readonly config: Config) {}

  async generate(source?: string) {
    try {
      const files = await this.config.files(source);

      const parser = new ParserEngine(files, this.config.tsConfig());

      const entities = await parser.entities();

      const functions: string[] = [];

      const entityNames = new Map<string, string>();
      for (const [name] of entities.entries()) {
        entityNames.set(name.toLowerCase(), name);
      }

      for (const [name, entity] of entities.entries()) {
        const functionCode = this.generateFunction(entity.type, name, entityNames);

        functions.push(functionCode);
      }

      const { locale } = this.config.options.faker();
      const { code } = await transform(this.generateSource(functions, locale), { minify: true, platform: "browser", target: "es2022" });

      const headlessPath = path.resolve(DIRNAME, this.HEADLESS_FILENAME);

      await fs.ensureDir(path.dirname(headlessPath));

      await Promise.all([fs.writeFile(headlessPath, code)]);

      return true;
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : (error as string));
      return false;
    }
  }

  private replacer(input: string, vars: Record<Uppercase<string>, string | number | boolean>) {
    let result = input;

    for (const variable in vars) {
      result = result.replace(new RegExp(variable, "g"), vars[variable as Uppercase<string>].toString().trim());
    }

    return result;
  }

  private generateSource(functions: string[], locale: string): string {
    const { pathPrefix, port } = this.config.options.server();

    return this.replacer(HEADLESS_SOURCE, {
      PORT: port,
      PREFIX: pathPrefix,
      LOCALE: locale,
      FUNCTIONS: functions.join(",\n"),
    });
  }

  private generateFunction(type: Type, name: string, entityNames: Map<string, string>): string {
    const properties = this.extractProperties(type);
    const propertyGens = properties.map((prop) => this.generateProperty(prop, entityNames, 1));

    return `${name}(){return {${propertyGens.join(",")}};}`;
  }

  private extractProperties(type: Type): Array<{ name: string; type: Type; fakerTag?: string; array?: boolean }> {
    if (!type.isObject()) {
      return [];
    }

    const props = type.getProperties();
    return props.map((prop) => {
      const propType = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
      const fakerTag = this.extractFakerTag(prop);
      return {
        name: prop.getName(),
        type: propType,
        fakerTag,
        array: propType.isArray(),
      };
    });
  }

  private extractFakerTag(prop: Symbol): string | undefined {
    const tags = prop.getJsDocTags().filter((tag) => tag.getName() === this.JSDOC_FAKER_FIELD);

    if (tags.length === 0) return undefined;

    const [display] = tags[0].getText();
    if (!display) return undefined;

    return display.text.trim();
  }

  private generateProperty(prop: { name: string; type: Type; fakerTag?: string; array?: boolean }, entityNames: Map<string, string>, indent: number = 0): unknown {
    const { name, type, fakerTag, array } = prop;
    const indentStr = "  ".repeat(indent);

    if (fakerTag) {
      const fakerCall = this.parseFakerTag(fakerTag);
      if (array) return `${name}: [${fakerCall}]`;
      return `${name}: ${fakerCall}`;
    }

    if (type.isArray()) {
      const elementType = type.getArrayElementTypeOrThrow();
      const elementSymbol = elementType.getSymbol();
      if (elementSymbol) {
        const elementName = elementSymbol.getName().toLowerCase();
        if (entityNames.has(elementName)) {
          return `${name}: [this.${elementName}()]`;
        }
      }
    } else {
      const symbol = type.getSymbol();
      if (symbol) {
        const symbolName = symbol.getName().toLowerCase();
        if (entityNames.has(symbolName)) {
          return `${name}: this.${symbolName}()`;
        }
      }
    }

    if (type.isString()) {
      if (array) return `${name}: [faker.word.noun()]`;
      return `${name}: faker.word.noun()`;
    }
    if (type.isNumber()) {
      if (array) return `${name}: [faker.number.int()]`;
      return `${name}: faker.number.int()`;
    }
    if (type.isBoolean()) {
      if (array) return `${name}: [faker.datatype.boolean()]`;
      return `${name}: faker.datatype.boolean()`;
    }
    if (type.isArray()) {
      const element = type.getArrayElementTypeOrThrow();
      return [this.generateProperty({ name, type: element, array: true }, entityNames, indent + 1)];
    }
    if (type.isObject()) {
      const nestedProps = this.extractProperties(type);
      if (nestedProps.length === 0) {
        return `${name}: {}`;
      }
      const nestedGenerators = nestedProps.map((p) => this.generateProperty(p, entityNames, indent + 1));
      const nestedIndent = "  ".repeat(indent + 1);
      return `${name}: {\n${nestedIndent}${nestedGenerators.map((gen) => gen).join(`,\n${nestedIndent}`)}\n${indentStr}}`;
    }

    return `${name}: null`;
  }

  private parseFakerTag(tag: string): string {
    const match = tag.match(this.FAKER_TAG_REGEX);

    if (!match) return `faker.word.noun()`;

    const [, path, argsRaw] = match;

    if (argsRaw && argsRaw.trim()) return `faker.${path}(${argsRaw})`;

    return `faker.${path}()`;
  }
}
