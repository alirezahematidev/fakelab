import fs from "fs-extra";
import path from "node:path";
import type { DatabaseOptions } from "../types";
import type { Config } from "../config/config";
import { Logger } from "../logger";

const CWD = process.cwd();

export class Database {
  private options: Required<DatabaseOptions>;
  static readonly DATABASE_DIR = path.resolve(CWD, ".fakelab/db");

  private constructor(private readonly config: Config) {
    this.enabled = this.enabled.bind(this);

    this.options = this.config.options.database();

    if (!this.options.enabled) fs.rmSync(Database.DATABASE_DIR, { force: true, recursive: true });
  }

  static register(config: Config) {
    return new Database(config);
  }

  enabled() {
    return this.options.enabled ?? false;
  }

  async initialize() {
    if (this.enabled()) {
      if (!this.config.enabled) {
        Logger.warn("Fakelab is disabled. Skipping database initialization.");
        return;
      }
      try {
        await fs.ensureDir(Database.DATABASE_DIR);

        await this.modifyGitignoreFile(".fakelab/*");
      } catch (error) {
        Logger.error(`Could not create database. error: %s`, error);
      }
    }
  }

  private async modifyGitignoreFile(name: string) {
    try {
      const filepath = path.resolve(CWD, ".gitignore");
      const content = await fs.readFile(filepath, { encoding: "utf8" });

      if (content.split("\n").some((line) => line.trim() === name.trim())) return;

      await fs.appendFile(filepath, `\n${name}`);
    } catch (error) {
      Logger.warn("Cannot modify .gitignore file. error: %s", error);
    }
  }
}
