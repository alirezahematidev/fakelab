import * as quicktype from "quicktype-core";
import fs from "fs-extra";
import { Logger } from "./logger";
import path from "node:path";
import { CWD } from "./file";
import { loadConfig } from "./load-config";

type SnapshotMeta = {
  snapshot: {
    sources: Array<{ url: string; name: string }>;
  };
};

type SnapshotCLIOptions = {
  name?: string;
  update?: boolean;
};

export class Snapshot {
  private static readonly TARGET_LANGUAGE = "typescript";
  private static readonly DEFAULT_TYPE_NAME = "Interface";
  private static readonly SNAPSHOT_DIR = path.resolve(CWD, ".fakelab/snapshots");

  static async fetch(url: string, name?: string): Promise<string> {
    const jsonInput = quicktype.jsonInputForTargetLanguage(this.TARGET_LANGUAGE);

    if (this.invalidUrl(url)) {
      Logger.error("snapshot url is invalid.");
      process.exit(1);
    }

    const response = await fetch(url);

    const input = await response.text();

    if (this.invalidJSON(input)) {
      Logger.error("snapshot response data is invalid json.");
      process.exit(1);
    }
    const meta = await this.readSnapshotMeta();

    await jsonInput.addSource({
      name: name || this.suffix((meta?.snapshot?.sources || []).length || 0),
      samples: [input],
    });

    const inputData = new quicktype.InputData();

    inputData.addInput(jsonInput);

    const { lines } = await quicktype.quicktype({
      inputData,
      lang: this.TARGET_LANGUAGE,
      rendererOptions: {
        "just-types": true,
      },
    });

    return lines.join("\n");
  }

  static async capture(url: string | undefined, options?: SnapshotCLIOptions) {
    const config = await loadConfig();

    const { enabled } = config.snapshotOpts();

    if (!enabled) return;

    if (!url) return await this.refetch();

    const content = await this.fetch(url, options?.name);

    await this.save(url, content, options);

    await this.modifyGitignoreFile("./fakelab/*");
  }

  static directoryPath() {
    return this.SNAPSHOT_DIR;
  }

  private static async save(url: string, content: string, options?: SnapshotCLIOptions) {
    try {
      await fs.ensureDir(this.SNAPSHOT_DIR);
      await fs.ensureFile(path.resolve(this.SNAPSHOT_DIR, "__meta.json"));

      const meta = await this.readSnapshotMeta();

      if (meta.snapshot.sources.some((source) => source.url === url.trim())) {
        if (options?.update) {
          Logger.info("Updating %s snapshot...", this.snapshotName(url, false));
          const freshContent = await this.fetch(url, options.name);

          await this.write(url, freshContent, options?.name);

          return;
        }

        Logger.warn("%s snapshot is already exists. Use --update flag to update.", url);
        return;
      }

      Logger.info("Saving %s snapshot...", this.snapshotName(url, false));
      await this.write(url, content, options?.name);
    } catch (error) {}
  }

  private static async write(url: string, content: string, name?: string) {
    await fs.writeFile(path.resolve(this.SNAPSHOT_DIR, this.snapshotName(url)), content);
    await this.updateSnapshotMeta(url, name);
  }

  private static async refetch() {
    const meta = await this.readSnapshotMeta();
    const sources = [...new Set(meta.snapshot.sources || [])];

    Logger.info("Updating all snapshots...");

    await Promise.all(
      sources.map(async (source) => {
        const filepath = path.resolve(this.SNAPSHOT_DIR, this.snapshotName(source.url));

        const exists = await fs.exists(filepath);

        if (exists) {
          const content = await this.fetch(source.url, source.name);
          await fs.writeFile(filepath, content);
        } else {
          const content = await this.fetch(source.url, source.name);
          await this.save(source.url, content, {});
        }
      })
    );
  }

  private static async readSnapshotMeta() {
    let meta: SnapshotMeta = { snapshot: { sources: [] } };

    try {
      meta = await fs.readJSON(path.resolve(this.SNAPSHOT_DIR, "__meta.json"));
    } catch (error) {}

    if (!meta.snapshot) meta.snapshot = { sources: [] };
    if (!meta.snapshot.sources) meta.snapshot.sources = [];

    return meta;
  }

  private static async updateSnapshotMeta(url: string, name?: string) {
    const meta = await this.readSnapshotMeta();

    const sources = meta.snapshot.sources || [];

    const updatingSourceIndex = sources.findIndex((source) => source.url === url);

    if (updatingSourceIndex === -1) sources.push({ name: name || this.suffix(sources.length), url });
    else {
      sources.splice(updatingSourceIndex, 1, { ...sources[updatingSourceIndex], name: name || sources[updatingSourceIndex].name });
    }

    meta.snapshot.sources = sources;

    await fs.writeJSON(path.resolve(this.SNAPSHOT_DIR, "__meta.json"), meta);
  }

  private static snapshotName(url: string, ext = true) {
    return url.replace(/^https?:\/\//, "").replace(/[\/:?.&=#]/g, "_") + (ext ? ".ts" : "");
  }

  private static suffix(suffix: string | number) {
    return `${this.DEFAULT_TYPE_NAME}${suffix.toString().toUpperCase()}`;
  }

  private static invalidUrl(url: string): boolean {
    try {
      new URL(url);
      return false;
    } catch {
      return true;
    }
  }

  private static invalidJSON(input: string): boolean {
    try {
      JSON.parse(input);
      return false;
    } catch (error) {
      return true;
    }
  }

  private static async modifyGitignoreFile(name: string) {
    try {
      const filepath = path.resolve(CWD, ".gitignore");
      const content = await fs.readFile(filepath, { encoding: "utf8" });

      if (content.split("\n").some((line) => line.trim() === name.trim())) return;

      await fs.appendFile(filepath, `\n${name}`);
    } catch (error) {}
  }
}
