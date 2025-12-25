import { transform, type TransformOptions } from "esbuild";
import type { DatabaseOptions } from "../types";
import { Logger } from "../logger";
import { SOURCE } from "./template";

export class RuntimeTemplate {
  private enabled: "true" | "false";
  private transformOptions: TransformOptions = { minify: true, platform: "browser", target: "es2022" };

  private constructor(protected readonly port: number, protected readonly prefix: string, protected readonly dbOptions?: DatabaseOptions) {
    this.enabled = this.dbOptions?.enabled ?? true ? "true" : "false";
  }

  static init(port: number, prefix: string, dbOptions?: DatabaseOptions) {
    return new RuntimeTemplate(port, prefix, dbOptions);
  }

  private replacer(input: string, vars: Record<Uppercase<string>, string | number>) {
    let result = input;

    for (const variable in vars) {
      result = result.replace(new RegExp(variable, "g"), vars[variable as Uppercase<string>].toString().trim());
    }

    return result;
  }

  async prepareSource() {
    const input = this.replacer(SOURCE, { PORT: this.port, PREFIX: this.prefix, ENABLED: this.enabled });
    try {
      const { code } = await transform(input, this.transformOptions);

      return code;
    } catch (error) {
      if (error instanceof Error) Logger.warn(error.message);
      return input;
    }
  }
}
