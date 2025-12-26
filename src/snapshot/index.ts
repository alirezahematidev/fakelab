import fs from "fs-extra";
import { Logger } from "../logger";
import path from "node:path";
import { loadConfig } from "../load-config";
import { SnapshotRegistry } from "./registry";
import type { SnapshotCLIOptions } from "../types";
import type { Config } from "../config/conf";

type SnapshotMeta = {
  snapshot: {
    sources: Array<{ url: string; name: string }>;
  };
};

export class Snapshot extends SnapshotRegistry {
  private constructor(protected readonly options?: SnapshotCLIOptions) {
    super();
  }

  static init(options?: SnapshotCLIOptions) {
    return new Snapshot(options);
  }

  async capture(url: string | undefined) {
    const config = await loadConfig();

    if (!config.options.snapshot().enabled) return;

    if (!url) {
      if (this.options?.update && typeof this.options?.update === "string") {
        return await this.update(config, this.options?.update);
      }

      return await this.updateAll(config);
    }

    const meta = await this.readSnapshotMeta();

    const defaultName = this.suffix((meta?.snapshot?.sources || []).length);

    const content = await this.fetch(url, this.options?.name || defaultName);

    await fs.ensureDir(this.SNAPSHOT_DIR);
    await fs.ensureFile(path.resolve(this.SNAPSHOT_DIR, "__meta.json"));

    await this.save(url, content, meta, config);

    await this.modifyGitignoreFile(".fakelab/*");
  }

  private async save(url: string, content: string, meta: SnapshotMeta, config: Config) {
    try {
      const _source = meta.snapshot.sources.find((source) => source.url === url);

      const isSaved = await fs.exists(path.resolve(this.SNAPSHOT_DIR, this.snapshotName(url)));

      if (!!_source && !isSaved) {
        return await this.write(url, content, this.options?.name || _source.name);
      }
      if (!_source && isSaved) {
        const snapshotOptions = config.options.snapshot();
        const missing = snapshotOptions.sources.find((s) => s.url === url);

        if (missing) {
          return await this.updateSnapshotMeta(url, missing.name, missing.headers);
        }
      }

      if (!!_source && isSaved) {
        if (this.options?.update && typeof this.options?.update === "boolean") {
          Logger.info("Updating %s snapshot...", this.snapshotName(url, false));

          const defaultName = this.suffix((meta?.snapshot?.sources || []).length);

          const freshContent = await this.fetch(url, this.options?.name || defaultName);

          await this.write(url, freshContent, this.options?.name);

          return;
        }

        Logger.warn("%s snapshot is already exists. To update use --update flag.", url);
        return;
      } else {
        if (!url) {
          Logger.warn("No url matched to update");
        }
      }

      Logger.info("Saving %s snapshot...", this.snapshotName(url, false));
      await this.write(url, content, this.options?.name);
    } catch (error) {
      console.log({ error });
    }
  }

  private async update(config: Config, sourceName: string) {
    const meta = await this.readSnapshotMeta();
    const sources = meta.snapshot.sources || [];

    const source = sources.find(({ name }) => name === sourceName);

    if (!source) {
      Logger.info("Cannot update snapshot source with given name.");
      return;
    }

    Logger.info("Updating %s snapshot source...", source.name);

    const filepath = path.resolve(this.SNAPSHOT_DIR, this.snapshotName(source.url));

    const exists = await fs.exists(filepath);

    if (exists) {
      const content = await this.fetch(source.url, source.name, source.headers);
      await fs.writeFile(filepath, content);
    } else {
      const content = await this.fetch(source.url, source.name, source.headers);
      await this.save(source.url, content, meta, config);
    }
  }

  private async updateAll(config: Config) {
    const meta = await this.readSnapshotMeta();
    const sources = meta.snapshot.sources || [];

    Logger.info("Updating all snapshots...");

    await Promise.all(
      sources.map(async (source) => {
        const filepath = path.resolve(this.SNAPSHOT_DIR, this.snapshotName(source.url));

        const exists = await fs.exists(filepath);

        if (exists) {
          const content = await this.fetch(source.url, source.name, source.headers);
          await fs.writeFile(filepath, content);
        } else {
          const content = await this.fetch(source.url, source.name, source.headers);
          await this.save(source.url, content, meta, config);
        }
      })
    );
  }
}
