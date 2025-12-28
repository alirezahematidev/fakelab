import type { Symbol, Type } from "ts-morph";
import type { Booleanish, EvaluatedFakerArgs, LazyFaker } from "./types";
import { Logger } from "./logger";

class Generator {
  private JSDOC_FAKER_FIELD = "faker";
  private FAKER_TAG_REGEX = /^([a-zA-Z0-9._]+)(?:\((.*)\))?$/;

  private boolMapping = { true: true, false: false };
  constructor(private readonly faker: LazyFaker) {}

  string(args: EvaluatedFakerArgs) {
    return this.execute(args, this.faker.word.noun);
  }

  int(args: EvaluatedFakerArgs) {
    return this.execute(args, this.faker.number.int);
  }

  bool(args: EvaluatedFakerArgs) {
    return this.execute(args, this.faker.datatype.boolean);
  }

  bigInt(args: EvaluatedFakerArgs) {
    return this.execute(args, this.faker.number.bigInt);
  }

  litbool(data: string) {
    return this.boolMapping[data as Booleanish];
  }

  async object(props: Symbol[], factory: (type: Type, generator: Generator, tags: EvaluatedFakerArgs[]) => Promise<unknown>) {
    const temp: Record<string, unknown> = {};

    await Promise.all(
      props.map(async (prop) => {
        const propType = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
        temp[prop.getName()] = await factory(propType, this, this.readJSDocTags(prop));
      })
    );

    return temp;
  }

  async union(unions: Promise<unknown>[]) {
    const result = await Promise.all(unions);
    return result[Math.floor(Math.random() * result.length)];
  }

  async intersection(intersections: Promise<unknown>[]) {
    const result = await Promise.all(intersections);
    return result[Math.floor(Math.random() * result.length)];
  }

  private evalArgs<T>(args: string): T | undefined {
    if (!args || !args.trim()) return undefined;
    return Function(`"use strict"; return (${args});`)();
  }

  private readJSDocTags(prop: Symbol): EvaluatedFakerArgs[] {
    const tags = prop.getJsDocTags().filter((tag) => tag.getName() === this.JSDOC_FAKER_FIELD);

    if (tags.length === 0) return [];

    return tags.map((tag) => {
      const [display] = tag.getText();

      if (!display) return undefined;

      const match = display.text.trim().match(this.FAKER_TAG_REGEX);

      if (!match) return undefined;

      const [, path, argsRaw] = match;

      const args = this.evalArgs(argsRaw);

      return { path, args };
    });
  }

  private execute<T>(data: EvaluatedFakerArgs | undefined, fallback: () => T): T {
    if (!data) return fallback();

    const parts = data.path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fn: any = this.faker;

    for (const part of parts) {
      fn = fn[part];
      if (!fn) {
        Logger.error("Invalid faker module path: (%s)", data.path);
        process.exit(1);
      }
    }

    if (typeof fn !== "function") {
      Logger.error("Unresolvable faker function. (%s)", data.path);
      process.exit(1);
    }

    try {
      return data.args ? fn(data.args) : fn();
    } catch (error) {
      Logger.error("Passed invalid arguments to faker function. error: %s", error);
      return fn();
    }
  }
}

export { Generator };
