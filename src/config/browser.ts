import { transform, type TransformOptions } from "esbuild";
import type { BrowserOptions, DatabaseOptions } from "../types";
import { GLOBAL_DECL_TEMP, GLOBAL_SOURCE_TEMP, MODULE_DECL_TEMP, MODULE_SOURCE_TEMP } from "./templates";
import { Logger } from "../logger";

class GlobalBrowserTemplate {
  protected name: string;
  protected databaseEnabled: "true" | "false";
  protected transformOptions: TransformOptions = { minify: true, platform: "browser", target: "es2022" };

  constructor(
    protected readonly port: number,
    protected readonly prefix: string,
    protected readonly browserOptions?: BrowserOptions,
    protected readonly dbOptions?: DatabaseOptions
  ) {
    this.name = this.browserOptions?.expose?.name || "fakelab";
    this.databaseEnabled = this.dbOptions?.enabled ?? true ? "true" : "false";
  }

  protected replacer(input: string, vars: Record<Uppercase<string>, string | number>) {
    let result = input;

    for (const variable in vars) {
      result = result.replace(new RegExp(variable, "g"), vars[variable as Uppercase<string>].toString().trim());
    }

    return result;
  }

  protected async prepareGlobalSource() {
    const input = this.replacer(GLOBAL_SOURCE_TEMP, { NAME: this.name, PORT: this.port, PREFIX: this.prefix, ENABLED_COND: this.databaseEnabled });
    try {
      const { code } = await transform(input, this.transformOptions);

      return code;
    } catch (error) {
      if (error instanceof Error) Logger.warn(error.message);
      return input;
    }
  }

  protected globalDeclaration() {
    return this.replacer(GLOBAL_DECL_TEMP, { NAME: this.name });
  }
}

export class BrowserTemplate extends GlobalBrowserTemplate {
  private constructor(
    protected readonly port: number,
    protected readonly prefix: string,
    protected readonly browserOptions?: BrowserOptions,
    protected readonly dbOptions?: DatabaseOptions
  ) {
    super(port, prefix, browserOptions, dbOptions);
  }

  static init(port: number, prefix: string, browserOptions?: BrowserOptions, dbOptions?: DatabaseOptions) {
    const instance = new BrowserTemplate(port, prefix, browserOptions, dbOptions);
    return new Proxy(instance, {
      get(target, p: keyof BrowserTemplate) {
        if (p === "prepareSource") {
          if (browserOptions?.expose?.mode === "global") return target["prepareGlobalSource"];
          return target["prepareSource"];
        }
        if (p === "declaration") {
          if (browserOptions?.expose?.mode === "global") return target["globalDeclaration"];
          return target["declaration"];
        }
        return target[p];
      },
    });
  }

  async prepareSource() {
    const input = this.replacer(MODULE_SOURCE_TEMP, { NAME: this.name, PORT: this.port, PREFIX: this.prefix, ENABLED_COND: this.databaseEnabled });
    try {
      const { code } = await transform(input, this.transformOptions);

      return code;
    } catch (error) {
      if (error instanceof Error) Logger.warn(error.message);
      return input;
    }
  }

  declaration() {
    return this.replacer(MODULE_DECL_TEMP, { NAME: this.name });
  }
}
