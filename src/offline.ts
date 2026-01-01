import path from "node:path";
import fs from "fs-extra";
import { Type, Symbol } from "ts-morph";
import { ParserEngine } from "./parserEngine";
import { DIRNAME } from "./file";
import { Database } from "./database";

// import { transform } from "esbuild";
import type { Config } from "./config/conf";

export class OfflineGenerator {
  private readonly OFFLINE_FILENAME = "offline.js";
  private readonly OFFLINE_DTS_FILENAME = "offline.d.ts";

  constructor(private readonly config: Config, private readonly database: Database) {}

  async generate(sp?: string) {
    const files = await this.config.files(sp);

    const parser = new ParserEngine(files, this.database);

    const entities = await parser.entities();

    const functions: string[] = [];
    const typeDeclarations: string[] = [];

    const entityNames = new Map<string, string>();
    for (const [name] of entities.entries()) {
      entityNames.set(name.toLowerCase(), name);
    }

    for (const [name, entity] of entities.entries()) {
      const functionName = name.toLowerCase();
      const functionCode = this.generateFunction(entity.type, functionName, entityNames);
      const typeDeclaration = this.generateTypeDeclaration(functionName);

      functions.push(functionCode);
      typeDeclarations.push(typeDeclaration);
    }

    const { locale } = this.config.options.faker();
    // const { code } = await transform(this.generateSource(functions, locale), { minify: true, platform: "browser", target: "es2022" });
    const dtsSource = this.generateTypeDeclarations(typeDeclarations);

    const offlinePath = path.resolve(DIRNAME, this.OFFLINE_FILENAME);
    const offlineDtsPath = path.resolve(DIRNAME, this.OFFLINE_DTS_FILENAME);

    await fs.ensureDir(path.dirname(offlinePath));

    await Promise.all([fs.writeFile(offlinePath, this.generateSource(functions, locale)), fs.writeFile(offlineDtsPath, dtsSource)]);

    parser.sync();
  }

  private generateSource(functions: string[], locale: string): string {
    return `import { faker } from "@faker-js/faker/locale/${locale}";

${functions.join("\n\n")}
`;
  }

  private generateTypeDeclarations(declarations: string[]): string {
    return `// Auto-generated offline data type declarations

${declarations.join("\n\n")}
`;
  }

  private generateTypeDeclaration(functionName: string): string {
    return `export interface Offline$ {}\nexport type Options = { count?:number }\nexport function ${functionName}(options?:Options): Offline$["${functionName}"];`;
  }

  private generateFunction(type: Type, functionName: string, entityNames: Map<string, string>): string {
    const properties = this.extractProperties(type);
    const propertyGenerators = properties.map((prop) => this.generateProperty(prop, entityNames, 1));

    return `export function ${functionName}(options) {
    const count = options?.count;
    const s = {${propertyGenerators.map((gen) => `    ${gen}`).join(",\n")}};

    if(count) {
      return Array.from({length: count},() => s)
    }

  return s;
}`;
  }

  private extractProperties(type: Type): Array<{ name: string; type: Type; fakerTag?: string }> {
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
      };
    });
  }

  private extractFakerTag(prop: Symbol): string | undefined {
    const tags = prop.getJsDocTags().filter((tag) => tag.getName() === "faker");

    if (tags.length === 0) return undefined;

    const [display] = tags[0].getText();
    if (!display) return undefined;

    return display.text.trim();
  }

  private generateProperty(prop: { name: string; type: Type; fakerTag?: string }, entityNames: Map<string, string>, indent: number = 0): string {
    const { name, type, fakerTag } = prop;
    const indentStr = "  ".repeat(indent);

    if (fakerTag) {
      // Parse the faker tag (e.g., "string.uuid" or "number.int({min:10,max:100})")
      const fakerCall = this.parseFakerTag(fakerTag);
      return `${name}: ${fakerCall}`;
    }

    // Check if this type references another entity
    // First check if it's an array and get the element type
    if (type.isArray()) {
      const elementType = type.getArrayElementTypeOrThrow();
      const elementSymbol = elementType.getSymbol();
      if (elementSymbol) {
        const elementName = elementSymbol.getName().toLowerCase();
        if (entityNames.has(elementName)) {
          return `${name}: [${elementName}()]`;
        }
      }
    } else {
      // Check if the type itself is an entity reference
      const symbol = type.getSymbol();
      if (symbol) {
        const symbolName = symbol.getName().toLowerCase();
        if (entityNames.has(symbolName)) {
          return `${name}: ${symbolName}()`;
        }
      }
    }

    // Fallback to default generators based on type
    if (type.isString()) {
      return `${name}: faker.word.noun()`;
    }
    if (type.isNumber()) {
      return `${name}: faker.number.int()`;
    }
    if (type.isBoolean()) {
      return `${name}: faker.datatype.boolean()`;
    }
    if (type.isArray()) {
      const elementType = type.getArrayElementTypeOrThrow();
      if (elementType.isObject()) {
        // For nested objects in arrays, generate a single object
        const nestedProps = this.extractProperties(elementType);
        if (nestedProps.length === 0) {
          return `${name}: [{}]`;
        }
        const nestedGenerators = nestedProps.map((p) => this.generateProperty(p, entityNames, indent + 1));
        const nestedIndent = "  ".repeat(indent + 1);
        return `${name}: [{\n${nestedIndent}${nestedGenerators.map((gen) => gen).join(`,\n${nestedIndent}`)}\n${indentStr}  }]`;
      }
      // For primitive arrays, return empty array
      return `${name}: []`;
    }
    if (type.isObject()) {
      // For nested objects, generate inline object
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
    // Match patterns like:
    // - "string.uuid"
    // - "number.int({min:10,max:100})"
    // - "person.fullName"
    const match = tag.match(/^([a-zA-Z0-9._]+)(?:\((.*)\))?$/);

    if (!match) {
      // Fallback if parsing fails
      return `faker.word.noun()`;
    }

    const [, path, argsRaw] = match;

    if (argsRaw && argsRaw.trim()) {
      // Has arguments - include them as-is in the generated code
      // This assumes the args are valid JavaScript
      return `faker.${path}(${argsRaw})`;
    }

    return `faker.${path}()`;
  }
}
