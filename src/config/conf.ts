import glob from "fast-glob";
import path from "node:path";
import fs from "fs-extra";
import { access, constants, stat } from "node:fs/promises";
import isGlob from "is-glob";
import { Logger } from "../logger";
import type { BrowserOptions, ConfigOptions, FakerEngineOptions, ServerCLIOptions, ServerOptions } from "../types";
import { defaultFakerLocale, FAKELAB_DEFAULT_PORT, FAKELABE_DEFAULT_PREFIX, FAKER_LOCALES, RUNTIME_DEFAULT_MODE, RUNTIME_DEFAULT_NAME, type FakerLocale } from "../constants";
import { BrowserTemplate } from "./browser";

export class Config {
  readonly RUNTIME_SOURCE_FILENAME = "runtime.js";
  readonly RUNTIME_DECL_FILENAME = "runtime.d.ts";
  constructor(private readonly opts: ConfigOptions) {
    this.files = this.files.bind(this);
    this.serverOpts = this.serverOpts.bind(this);
    this.fakerOpts = this.fakerOpts.bind(this);
    this.browserOpts = this.browserOpts.bind(this);
  }

  public async files(_sourcePath?: string) {
    const sourcePaths = this.resolveSourcePath(_sourcePath || this.opts.sourcePath);

    const result = Array.from(new Set((await Promise.all(sourcePaths.map((src) => this.resolveTSFiles(src)))).flat()));

    if (result.length === 0) {
      Logger.error("No Typescript files found in: %s", Logger.list(sourcePaths.map((sp) => path.basename(sp))));
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

  public browserOpts(name?: string, mode?: "module" | "global"): Required<BrowserOptions> {
    return {
      expose: {
        mode: mode || this.opts.browser?.expose?.mode || RUNTIME_DEFAULT_MODE,
        name: name || this.opts.browser?.expose?.name || RUNTIME_DEFAULT_NAME,
      },
    };
  }

  public fakerOpts(locale?: FakerLocale): Required<FakerEngineOptions> {
    const _locale = (locale || this.opts.faker?.locale)?.toLowerCase();

    if (_locale && FAKER_LOCALES.includes(_locale as FakerLocale)) {
      return { locale: _locale as FakerLocale };
    }
    return { locale: defaultFakerLocale() };
  }

  async generateInFileRuntimeConfig(dirname: string, options: ServerCLIOptions) {
    const { port, pathPrefix } = this.serverOpts(options.pathPrefix, options.port);

    await this.tryPrepareDatabase();

    const sourcePath = path.resolve(dirname, this.RUNTIME_SOURCE_FILENAME);
    const declarationPath = path.resolve(dirname, this.RUNTIME_DECL_FILENAME);

    const browser = BrowserTemplate.init(port, pathPrefix, this.opts.browser, this.opts.database);

    const source = await browser.prepareSource();

    await Promise.all([fs.writeFile(sourcePath, source), fs.writeFile(declarationPath, browser.declaration())]);
  }

  getDatabaseDirectoryPath() {
    const name = this.opts.database?.dest || "db";
    return path.resolve(process.cwd(), name);
  }

  databaseEnabled() {
    return this.opts.database?.enabled ?? false;
  }

  private async tryPrepareDatabase() {
    if (this.databaseEnabled()) {
      try {
        const name = this.opts.database?.dest || "db";
        await fs.ensureDir(this.getDatabaseDirectoryPath());

        await this.modifyGitignoreFile(name);
      } catch (error) {
        Logger.error(`Could not create database.`);
      }
    } else if (!this.opts.database || !this.databaseEnabled()) {
      await fs.rm(this.getDatabaseDirectoryPath(), { force: true, recursive: true });
    }
  }

  private async modifyGitignoreFile(name: string) {
    try {
      const filepath = path.resolve(process.cwd(), ".gitignore");
      const content = await fs.readFile(filepath, { encoding: "utf8" });

      if (content.split("\n").some((line) => line.trim() === name.trim())) return;

      await fs.appendFile(filepath, `\n${name}`);
    } catch (error) {
      Logger.error(`Could not modify .gitignore file.`);
    }
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
    return sourcePathToArray.map((sp) => {
      if (isGlob(sp, { strict: true })) return sp;
      return path.resolve(sp);
    });
  }

  private async resolveTSFiles(sourcePath: string): Promise<string[]> {
    // is glob pattern
    if (isGlob(sourcePath, { strict: true })) {
      Logger.info(`source: %s`, sourcePath);
      return glob(sourcePath, {
        absolute: true,
        ignore: ["**/*.d.ts"],
      });
    }

    const absPath = path.resolve(sourcePath);

    const filePath = absPath.endsWith(".ts") ? absPath : absPath + ".ts";

    const fileStat = await this.tryStat(filePath);
    if (fileStat?.isFile()) {
      if (!(await this.isReadable(filePath))) {
        Logger.error("Cannot read file: %s", filePath);
        process.exit(1);
      }
      Logger.info(`source: %s`, filePath);
      return [filePath];
    }

    const dirStat = await this.tryStat(absPath);

    if (dirStat?.isDirectory()) {
      Logger.info(`source: %s`, absPath);

      return glob("**/*.ts", {
        cwd: absPath,
        absolute: true,
        ignore: ["**/*.d.ts"],
      });
    }

    Logger.warn(`invalid source: [REDACTED]/%s`, path.basename(filePath));
    return [];
  }
}
