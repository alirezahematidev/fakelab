import fs from "fs-extra";
import path from "node:path";
import type { DatabaseOptions } from "./types";
import { CWD } from "./file";
import { Logger } from "./logger";
import type { Config } from "./config/conf";

export class Database {
  private options: Required<DatabaseOptions>;

  private constructor(private readonly config: Config) {
    this.enabled = this.enabled.bind(this);
    this.directoryPath = this.directoryPath.bind(this);

    this.options = this.config.databaseOpts();

    if (!this.options.enabled) fs.rmSync(this.directoryPath(), { force: true, recursive: true });
  }

  static register(config: Config) {
    return new Database(config);
  }

  enabled() {
    return this.options.enabled ?? false;
  }

  directoryPath() {
    return path.resolve(CWD, ".fakelab/db");
  }

  async initialize() {
    if (this.enabled()) {
      try {
        await fs.ensureDir(this.directoryPath());

        await this.modifyGitignoreFile(".fakelab/*");
      } catch (error) {
        Logger.error(`Could not create database.`);
      }
    }
  }

  private async modifyGitignoreFile(name: string) {
    try {
      const filepath = path.resolve(CWD, ".gitignore");
      const content = await fs.readFile(filepath, { encoding: "utf8" });

      if (content.split("\n").some((line) => line.trim() === name.trim())) return;

      await fs.appendFile(filepath, `\n${name}`);
    } catch (error) {}
  }
}
