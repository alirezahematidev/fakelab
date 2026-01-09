import { createHash } from "node:crypto";
import fs from "fs-extra";
import path from "node:path";
import { CWD } from "./file";
import { Logger } from "./logger";
import type { Config } from "./config/config";

class Cache {
  static readonly CACHE_DIR = path.resolve(CWD, ".fakelab/cache");

  constructor(private readonly config: Config) {
    if (!this.config.options.cache().enabled) {
      this.clear();
    }
  }

  private __key__(input: string) {
    return createHash("sha1").update(input).digest("hex").slice(0, 24);
  }

  async get(name: string, input: string | null): Promise<{ json: string; data: unknown } | null> {
    const { enabled, ttl } = this.config.options.cache();

    if (!enabled || input === null) return null;

    const key = this.__key__(input);

    const filePath = path.resolve(Cache.CACHE_DIR, `${name}_${key}.json`);

    if (!(await fs.exists(filePath))) return null;

    try {
      const stats = await this.ensureStats(filePath);

      if (stats && ttl > 0 && Date.now() - stats.mtimeMs > ttl) return null;

      const json = await fs.readFile(filePath, "utf8");

      return { json, data: JSON.parse(json) };
    } catch (e) {
      if (e instanceof Error) Logger.error(e.message);
      return null;
    }
  }

  async set(name: string, input: string | null, value: string): Promise<void> {
    const { enabled } = this.config.options.cache();

    if (!enabled || input === null) return;

    const key = this.__key__(input);

    const dirPath = path.resolve(Cache.CACHE_DIR);

    const filePath = path.resolve(dirPath, `${name}_${key}.json`);

    const tmpPath = filePath + ".tmp";

    await fs.ensureDir(dirPath);

    await fs.writeFile(tmpPath, value);

    await fs.rename(tmpPath, filePath);
  }

  async delete(name: string, input: string | null): Promise<void> {
    const { enabled } = this.config.options.cache();

    if (!enabled || input === null) return;

    const key = this.__key__(input);

    const filePath = path.resolve(Cache.CACHE_DIR, `${name}_${key}.json`);

    await fs.rm(filePath, { force: true });
  }

  async clear(): Promise<void> {
    await fs.rm(Cache.CACHE_DIR, { recursive: true, force: true });
  }

  private async ensureStats(filePath: string) {
    try {
      const stats = await fs.stat(filePath);

      return stats;
    } catch {
      return null;
    }
  }
}

function createFileCache(config: Config) {
  return new Cache(config);
}

export { createFileCache };
