import { transform, type TransformOptions } from "esbuild";
import { Logger } from "../logger";
import path from "node:path";

export class BaseSourceConfig {
  protected transformOptions: TransformOptions = { minify: true, platform: "browser", target: "es2022" };

  constructor(protected readonly dirname: string, protected readonly _args: Record<Uppercase<string>, string | number | boolean> = {}) {}

  protected replacer(input: string, vars: Record<Uppercase<string>, string | number | boolean>) {
    let result = input;

    for (const variable in vars) {
      result = result.replace(new RegExp(variable, "g"), vars[variable as Uppercase<string>].toString().trim());
    }

    return result;
  }

  public async prepare(source: string, filename: string) {
    const input = this.replacer(source, this._args);
    const filepath = path.resolve(this.dirname, filename);

    try {
      const { code } = await transform(input, this.transformOptions);

      return { code, filepath };
    } catch (error) {
      if (error instanceof Error) Logger.warn(error.message);
      return { code: input, filepath };
    }
  }
}
