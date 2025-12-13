import glob from "fast-glob";
import path from "node:path";
import { access, constants, stat } from "node:fs/promises";
import { Logger } from "../logger";
import type { ConfigOptions, FakerEngineOptions, FakerLocale, ServerOptions } from "../types";
import { defaultFakerLocale, FAKELAB_DEFAULT_PORT, FAKELABE_DEFAULT_PREFIX } from "../constants";

export class Config {
  constructor(private readonly opts: ConfigOptions) {
    this.files = this.files.bind(this);
    this.serverOpts = this.serverOpts.bind(this);
    this.fakerOpts = this.fakerOpts.bind(this);
  }

  public async files(_sourcePath?: string) {
    const sourcePaths = this.resolveSourcePath(_sourcePath || this.opts.sourcePath);

    const result = Array.from(new Set((await Promise.all(sourcePaths.map((src) => this.resolveTSFiles(src)))).flat()));

    if (result.length === 0) {
      Logger.error("No Typescript files found in:\n%s", sourcePaths.join("\n"));
      process.exit(1);
    }

    return result;
  }

  public serverOpts(prefix?: string, port?: number): Required<ServerOptions> {
    return {
      pathPrefix: prefix || this.opts.server?.pathPrefix || FAKELABE_DEFAULT_PREFIX,
      port: port || this.opts.server?.port || FAKELAB_DEFAULT_PORT,
    };
  }

  public fakerOpts(locale?: FakerLocale): Required<FakerEngineOptions> {
    return {
      locale: locale || this.opts.faker?.locale || defaultFakerLocale(),
    };
  }

  private async tryStat(p: string) {
    try {
      return await stat(p);
    } catch {
      return null;
    }
  }

  private async isReadable(p: string) {
    try {
      await access(p, constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  private resolveSourcePath(sourcePath: string | string[]) {
    const sourcePathToArray = Array.isArray(sourcePath) ? sourcePath : [sourcePath];
    return sourcePathToArray.map((sp) => path.resolve(sp));
  }

  private async resolveTSFiles(sourcePath: string): Promise<string[]> {
    const absPath = path.resolve(sourcePath);

    const filePath = absPath.endsWith(".ts") ? absPath : absPath + ".ts";

    const fileStat = await this.tryStat(filePath);
    if (fileStat?.isFile()) {
      if (!(await this.isReadable(filePath))) {
        throw new Error(`Cannot read file: ${filePath}`);
      }
      Logger.info("Source:", filePath);
      return [filePath];
    }

    const dirStat = await this.tryStat(absPath);

    if (dirStat?.isDirectory()) {
      Logger.info("Source:", absPath);

      return glob("**/*.ts", {
        cwd: absPath,
        absolute: true,
        ignore: ["**/*.d.ts"],
      });
    }

    Logger.error(`Invalid source path: ${sourcePath}`);
    process.exit(1);
  }
}
