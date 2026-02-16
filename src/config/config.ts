import glob from "fast-glob";
import path from "node:path";
import fs from "fs-extra";
import { access, constants, stat } from "node:fs/promises";
import isGlob from "is-glob";
import { Logger } from "../logger";
import type { ConfigOptions, ServerCLIOptions } from "../types";
import { RuntimeSource } from "../runtime/source";
import { DatabaseSource } from "../database/source";
import { ConfigOptHandler } from "./options";
import type { FakerLocale } from "../constants";

export class Config extends ConfigOptHandler {
  readonly FAKELAB_PERSIST_DIR = ".fakelab";

  constructor(protected readonly opts: ConfigOptions) {
    super(opts);

    this.files = this.files.bind(this);
    this.writeSource = this.writeSource.bind(this);
  }

  getTSConfigFilePath(tsConfigFilePath?: string) {
    return tsConfigFilePath || this.opts.tsConfigFilePath || this.DEFAULT_TS_CONFIG_FILE;
  }

  get enabled() {
    return this.opts.enabled ?? true;
  }

  getSourceFiles(_sourcePath?: string) {
    const inputSourcePath = _sourcePath || this.opts.sourcePath;

    return this.resolveSourcePath(inputSourcePath);
  }

  async files(_sourcePath: string | undefined) {
    if (!this.enabled) return [];

    const sourcePaths = this.getSourceFiles(_sourcePath);

    const resolvedFiles = sourcePaths.length > 0 ? Array.from(new Set((await Promise.all(sourcePaths.map((src) => this.resolveTSFiles(src)))).flat())) : [];

    if (this.options.server().includeSnapshots) {
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

  private writeSource({ code, filepath }: { code: string; filepath: string }) {
    return fs.writeFile(filepath, code);
  }

  async initializeRuntimeConfig(dirname: string, options: ServerCLIOptions) {
    if (!this.enabled) {
      Logger.warn("Fakelab is disabled. Skipping runtime initialization.");
      return;
    }

    const { port, pathPrefix } = this.options.server(options.pathPrefix, options.port);

    const { locale } = this.options.faker(options.locale as FakerLocale);

    const { headless } = this.options.runtime();

    const runtimeSource = new RuntimeSource(dirname, port, pathPrefix, locale, this.enabled, headless);

    const databaseSource = new DatabaseSource(dirname, port, pathPrefix, locale, this.options.database());

    runtimeSource.prepare().then(this.writeSource);
    databaseSource.prepare().then(this.writeSource);
  }

  private async getSnapshotSourceFiles() {
    const snapshotFiles = await glob(".fakelab/snapshots/**/*.ts", { absolute: true, ignore: ["**/*.d.ts"], cwd: process.cwd() });

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
    if (isGlob(sourcePath, { strict: true })) {
      Logger.info(`Source %s`, sourcePath);
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
      Logger.info(`Source %s`, filePath);
      return [filePath];
    }

    const dirStat = await this.tryStat(absPath);

    if (dirStat?.isDirectory()) {
      Logger.info(`Source %s`, absPath);

      return glob("**/*.ts", {
        cwd: absPath,
        absolute: true,
        ignore: ["**/*.d.ts"],
      });
    }

    Logger.warn(`Invalid source: [REDACTED]/%s`, path.basename(filePath));
    return [];
  }
}
