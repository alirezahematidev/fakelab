import glob from "fast-glob";
import path from "node:path";
import fs from "fs-extra";
import { access, constants, stat } from "node:fs/promises";
import isGlob from "is-glob";
import { Logger } from "../logger";
import type { ConfigOptions, LoadConfigOptions, ServerCLIOptions } from "../types";
import { CONFIG_FILE_NAME } from "../constants";
import { CWD } from "../file";
import { RuntimeSource } from "../runtime/source";
import { DatabaseSource } from "../database/source";
import { ConfigOptHandler } from "./options";

export class Config extends ConfigOptHandler {
  readonly FAKELAB_PERSIST_DIR = ".fakelab";

  private shouldOnlyComutingFilepath: string | undefined;

  constructor(protected readonly opts: ConfigOptions) {
    super(opts);

    this.files = this.files.bind(this);
  }

  getTSConfigFilePath(tsConfigFilePath?: string) {
    return tsConfigFilePath || this.opts.tsConfigFilePath || this.DEFAULT_TS_CONFIG_FILE;
  }

  setShouldOnlyComputingFilepath({ _filepath }: LoadConfigOptions = { _filepath: null }) {
    if (_filepath && path.basename(_filepath) !== CONFIG_FILE_NAME && _filepath.endsWith(".ts")) {
      this.shouldOnlyComutingFilepath = _filepath.trim();
    }
  }

  isHeadless() {
    return this.opts.headless ?? false;
  }

  enabled() {
    return this.opts.enabled ?? true;
  }

  getSourceFiles(_sourcePath?: string) {
    const inputSourcePath = _sourcePath || this.opts.sourcePath;

    return this.resolveSourcePath(inputSourcePath);
  }

  async files(_sourcePath: string | undefined) {
    if (!this.enabled()) return [];

    const sourcePaths = this.getSourceFiles(_sourcePath);

    if (this.shouldOnlyComutingFilepath) {
      return [this.shouldOnlyComutingFilepath];
    }

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

  async initializeRuntimeConfig(dirname: string, options: ServerCLIOptions) {
    if (!this.enabled()) {
      Logger.warn("Fakelab is disabled. Skipping runtime initialization.");
      return;
    }

    const { port, pathPrefix } = this.options.server(options.pathPrefix, options.port);

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
