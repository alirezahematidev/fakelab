import glob from "fast-glob";
import path from "node:path";
import fs from "fs-extra";
import { access, constants, stat } from "node:fs/promises";
import isGlob from "is-glob";
import { Logger } from "../logger";
import type {
  CacheOptions,
  ConfigOptions,
  DatabaseOptions,
  FakerEngineOptions,
  GraphQLOptions,
  NetworkOptions,
  ServerCLIOptions,
  ServerOptions,
  SnapshotOptions,
  WebhookOptions,
} from "../types";
import { defaultFakerLocale, FAKELAB_DEFAULT_PORT, FAKELABE_DEFAULT_PREFIX, FAKER_LOCALES, type FakerLocale } from "../constants";
import { CWD } from "../file";
import { RuntimeSource } from "../runtime/source";
import { DatabaseSource } from "../database/source";

export class Config {
  readonly FAKELAB_PERSIST_DIR = ".fakelab";

  NETWORK_DEFAULT_OPTIONS: Readonly<NetworkOptions>;

  constructor(private readonly configOptions: ConfigOptions) {
    this.files = this.files.bind(this);
    this._serverOptions = this._serverOptions.bind(this);
    this._databaseOptions = this._databaseOptions.bind(this);
    this._networkOptions = this._networkOptions.bind(this);
    this._snapshotOptions = this._snapshotOptions.bind(this);
    this._fakerOptions = this._fakerOptions.bind(this);
    this._webhookOptions = this._webhookOptions.bind(this);
    this._graphQLOptions = this._graphQLOptions.bind(this);
    this._cacheOptions = this._cacheOptions.bind(this);

    this.NETWORK_DEFAULT_OPTIONS = Object.freeze({
      delay: this.configOptions.network?.delay || 0,
      errorRate: this.configOptions.network?.errorRate || 0,
      timeoutRate: this.configOptions.network?.timeoutRate || 0,
      offline: this.configOptions.network?.offline ?? false,
    });
  }

  public get options() {
    return {
      server: this._serverOptions,
      database: this._databaseOptions,
      network: this._networkOptions,
      snapshot: this._snapshotOptions,
      faker: this._fakerOptions,
      webhook: this._webhookOptions,
      graphQL: this._graphQLOptions,
      cache: this._cacheOptions,
    };
  }

  getTSConfigFilePath(tsConfigFilePath?: string) {
    return tsConfigFilePath || this.configOptions.tsConfigFilePath || "tsconfig.json";
  }

  isHeadless() {
    return this.configOptions.headless ?? false;
  }

  private _cacheOptions(): Required<CacheOptions> {
    return {
      enabled: this.configOptions.cache?.enabled ?? true,
      ttl: this.configOptions.cache?.ttl || 15 * 60 * 1000,
    };
  }

  private _serverOptions(prefix?: string, port?: number): Required<ServerOptions> {
    return {
      pathPrefix: prefix || this.configOptions.server?.pathPrefix || FAKELABE_DEFAULT_PREFIX,
      port: port || this.configOptions.server?.port || FAKELAB_DEFAULT_PORT,
      includeSnapshots: this.configOptions.server?.includeSnapshots ?? true,
      openapi: this.configOptions.server?.openapi ?? false,
    };
  }

  private _databaseOptions(): Required<DatabaseOptions> {
    return {
      enabled: this.configOptions.database?.enabled ?? false,
    };
  }

  private _networkOptions(): NetworkOptions {
    const preset = this.configOptions.network?.preset;
    const presets = this.configOptions.network?.presets ?? {};

    if (!preset || !presets[preset]) return this.NETWORK_DEFAULT_OPTIONS;

    return {
      ...presets[preset],
      ...(this.configOptions.network ?? {}),
    };
  }

  private _snapshotOptions(): Required<SnapshotOptions> {
    return {
      enabled: this.configOptions.snapshot?.enabled ?? false,
      sources: this.configOptions.snapshot?.sources || [],
    };
  }

  private _graphQLOptions(): Required<GraphQLOptions> {
    return {
      enabled: this.configOptions.graphQL?.enabled ?? false,
    };
  }

  private _fakerOptions(locale?: FakerLocale): Required<FakerEngineOptions> {
    const lang = (locale || this.configOptions.faker?.locale)?.toLowerCase();

    if (lang && FAKER_LOCALES.includes(lang as FakerLocale)) {
      return { locale: lang as FakerLocale };
    }
    return { locale: defaultFakerLocale() };
  }

  private _webhookOptions(): Required<WebhookOptions> {
    return {
      enabled: this.configOptions.webhook?.enabled ?? false,
      hooks: this.configOptions.webhook?.hooks ?? [],
    };
  }

  public enabled() {
    return this.configOptions.enabled ?? true;
  }

  public async files(_sourcePath?: string) {
    const inputSourcePath = _sourcePath || this.configOptions.sourcePath;

    if (!this.enabled()) return [];

    const sourcePaths = this.resolveSourcePath(inputSourcePath);

    const resolvedFiles = sourcePaths.length > 0 ? Array.from(new Set((await Promise.all(sourcePaths.map((src) => this.resolveTSFiles(src)))).flat())) : [];

    if (this._serverOptions().includeSnapshots) {
      const snapshots = await this.getSnapshotSourceFiles();
      resolvedFiles.push(...snapshots);
    }

    if (resolvedFiles.length === 0) {
      const basenames = sourcePaths.map((sp) => path.basename(sp));

      if (basenames.length === 0) {
        Logger.error("No source path found.");
      } else {
        Logger.error("No Typescript files found in: %s", Logger.list(basenames));
      }

      process.exit(1);
    }
    return resolvedFiles;
  }

  async initializeRuntimeConfig(dirname: string, options: ServerCLIOptions) {
    if (!this.enabled()) {
      Logger.warn("Fakelab is disabled. Skipping runtime initialization.");
      return;
    }

    const { port, pathPrefix } = this._serverOptions(options.pathPrefix, options.port);

    const runtimeSource = RuntimeSource.init(dirname, port, pathPrefix, this.enabled());

    const databaseSource = DatabaseSource.init(dirname, port, pathPrefix, this.options.database().enabled);

    const sources = await Promise.all([runtimeSource.prepare(), databaseSource.prepare()]);

    await Promise.all(sources.map(({ filepath, code }) => fs.writeFile(filepath, code)));
  }

  private async getSnapshotSourceFiles() {
    const snapshotFiles = await glob(".fakelab/snapshots/**/*.ts", { absolute: true, ignore: ["**/*.d.ts"], cwd: CWD });

    if (snapshotFiles.length > 0) {
      Logger.info("Snapshot(s): %s", Logger.list(snapshotFiles.map((file) => path.parse(file).name)));
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
      Logger.info(`Source: %s`, sourcePath);
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
      Logger.info(`Source: %s`, filePath);
      return [filePath];
    }

    const dirStat = await this.tryStat(absPath);

    if (dirStat?.isDirectory()) {
      Logger.info(`Source: %s`, absPath);

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
