import glob from "fast-glob";
import path from "node:path";
import fs from "fs-extra";
import { access, constants, stat } from "node:fs/promises";
import isGlob from "is-glob";
import { Logger } from "../logger";
import type { BrowserOptions, ConfigOptions, DatabaseOptions, FakerEngineOptions, NetworkOptions, ServerCLIOptions, ServerOptions, SnapshotOptions } from "../types";
import { defaultFakerLocale, FAKELAB_DEFAULT_PORT, FAKELABE_DEFAULT_PREFIX, FAKER_LOCALES, RUNTIME_DEFAULT_MODE, RUNTIME_DEFAULT_NAME, type FakerLocale } from "../constants";
import { BrowserTemplate } from "./browser";
import { CWD } from "../file";

export class Config {
  readonly RUNTIME_SOURCE_FILENAME = "runtime.js";
  readonly RUNTIME_DECL_FILENAME = "runtime.d.ts";

  readonly FAKELAB_PERSIST_DIR = ".fakelab";

  NETWORK_DEFAULT_OPTIONS: Readonly<NetworkOptions>;

  constructor(private readonly opts: ConfigOptions) {
    this.files = this.files.bind(this);
    this.serverOpts = this.serverOpts.bind(this);
    this.fakerOpts = this.fakerOpts.bind(this);
    this.browserOpts = this.browserOpts.bind(this);

    this.NETWORK_DEFAULT_OPTIONS = Object.freeze({
      delay: this.opts.network?.delay || 0,
      errorRate: this.opts.network?.errorRate || 0,
      timeoutRate: this.opts.network?.timeoutRate || 0,
      offline: this.opts.network?.offline ?? false,
    });
  }

  public async files(_sourcePath?: string) {
    const sourcePaths = this.resolveSourcePath(_sourcePath || this.opts.sourcePath);

    const resolvedFiles = Array.from(new Set((await Promise.all(sourcePaths.map((src) => this.resolveTSFiles(src)))).flat()));

    if (this.serverOpts().includeSnapshots) {
      const snapshots = await this.getSnapshotSourceFiles();
      resolvedFiles.push(...snapshots);
    }

    if (resolvedFiles.length === 0) {
      Logger.error("No Typescript files found in: %s", Logger.list(sourcePaths.map((sp) => path.basename(sp))));
      process.exit(1);
    }
    return resolvedFiles;
  }

  public serverOpts(prefix?: string, port?: number): Required<ServerOptions> {
    return {
      pathPrefix: prefix || this.opts.server?.pathPrefix || FAKELABE_DEFAULT_PREFIX,
      port: port || this.opts.server?.port || FAKELAB_DEFAULT_PORT,
      includeSnapshots: this.opts.server?.includeSnapshots ?? true,
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

  public databaseOpts(): Required<DatabaseOptions> {
    return {
      enabled: this.opts.database?.enabled ?? false,
    };
  }

  public networkOpts(): NetworkOptions {
    const preset = this.opts.network?.preset;
    const presets = this.opts.network?.presets ?? {};

    if (!preset || !presets[preset]) return this.NETWORK_DEFAULT_OPTIONS;

    return {
      ...presets[preset],
      ...(this.opts.network ?? {}),
    };
  }

  public snapshotOpts(): Required<SnapshotOptions> {
    return {
      enabled: this.opts.snapshot?.enabled ?? false,
    };
  }

  public fakerOpts(locale?: FakerLocale): Required<FakerEngineOptions> {
    const lang = (locale || this.opts.faker?.locale)?.toLowerCase();

    if (lang && FAKER_LOCALES.includes(lang as FakerLocale)) {
      return { locale: lang as FakerLocale };
    }
    return { locale: defaultFakerLocale() };
  }

  async generateInFileRuntimeConfig(dirname: string, options: ServerCLIOptions) {
    const { port, pathPrefix } = this.serverOpts(options.pathPrefix, options.port);

    const sourcePath = path.resolve(dirname, this.RUNTIME_SOURCE_FILENAME);
    const declarationPath = path.resolve(dirname, this.RUNTIME_DECL_FILENAME);

    const browser = BrowserTemplate.init(port, pathPrefix, this.opts.browser, this.opts.database);

    const source = await browser.prepareSource();

    await Promise.all([fs.writeFile(sourcePath, source), fs.writeFile(declarationPath, browser.declaration())]);
  }

  private async getSnapshotSourceFiles() {
    const snapshotFiles = await glob(".fakelab/snapshots/**/*.ts", { absolute: true, ignore: ["**/*.d.ts"], cwd: CWD });

    if (snapshotFiles.length > 0) {
      Logger.info("snapshot(s): %s", Logger.list(snapshotFiles.map((file) => path.parse(file).name)));
    }

    return snapshotFiles;
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
