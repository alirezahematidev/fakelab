import path from "node:path";
import fs from "fs-extra";
import { CWD } from "../file";
import { Logger } from "../logger";
import type { ServerCLIOptions, SnapshotDataSource } from "../types";
import type { Config } from "../config/conf";

type SnapshotMeta = {
  snapshot: {
    sources: Array<{ url: string; name: string; headers?: SnapshotDataSource["headers"] }>;
  };
};

export class SnapshotRegistry {
  readonly TARGET_LANGUAGE = "typescript";
  readonly DEFAULT_TYPE_NAME = "Interface";
  readonly SNAPSHOT_DIR = path.resolve(CWD, ".fakelab/snapshots");

  protected constructor(protected readonly options?: ServerCLIOptions) {}

  static register(options?: ServerCLIOptions) {
    return new SnapshotRegistry(options);
  }

  public async captureProvidedSources(config: Config) {
    const { enabled, sources } = config.options.snapshot();

    if (!enabled) return;

    if (sources.length === 0) return;

    await fs.ensureDir(this.SNAPSHOT_DIR);
    await fs.ensureFile(path.resolve(this.SNAPSHOT_DIR, "__meta.json"));

    if (this.options?.freshSnapshots) {
      Logger.info("Updating all snapshot sources...");
      await Promise.all(
        sources.map(async ({ url, name, headers }) => {
          const content = await this.fetch(url, name, headers);

          this.write(url, content, name, headers);
        })
      );

      return;
    }

    const missingSources = sources.filter(({ url }) => !fs.existsSync(path.resolve(this.SNAPSHOT_DIR, this.snapshotName(url))));

    if (missingSources.length === 0) {
      const meta = await this.readSnapshotMeta();
      const ms = meta.snapshot.sources || [];
      const missingMeta = sources.filter(({ url }) => !ms.some((source) => source.url === url));

      if (missingMeta.length === 0) {
        Logger.warn("All snapshot sources was captured once. To update use --fresh-snapshots flag.");
      } else {
        Logger.info("Updating snapshot meta...");
        await Promise.all(
          missingMeta.map(async ({ url, name, headers }) => {
            this.updateSnapshotMeta(url, name, headers);
          })
        );
      }

      return;
    }

    Logger.info("Capturing snapshot sources...");

    await Promise.all(
      missingSources.map(async ({ url, name, headers }) => {
        const content = await this.fetch(url, name, headers);

        this.write(url, content, name, headers);
      })
    );

    this.modifyGitignoreFile(".fakelab/*");
  }

  protected async fetch(url: string, name: string, headers?: SnapshotDataSource["headers"]): Promise<string> {
    if (this.invalidUrl(url)) {
      Logger.error("snapshot url is invalid.");
      process.exit(1);
    }

    const response = await fetch(url, { headers });

    const input = await response.text();

    if (this.invalidJSON(input)) {
      Logger.error("snapshot response data is invalid json.");
      process.exit(1);
    }

    const qt = await import("quicktype-core");

    const jsonInput = qt.jsonInputForTargetLanguage(this.TARGET_LANGUAGE);

    await jsonInput.addSource({
      name,
      samples: [input],
    });

    const inputData = new qt.InputData();

    inputData.addInput(jsonInput);

    const { lines } = await qt.quicktype({
      inputData,
      lang: this.TARGET_LANGUAGE,
      rendererOptions: {
        "just-types": true,
      },
    });

    return lines.join("\n");
  }

  protected async write(url: string, content: string, name?: string, headers?: SnapshotDataSource["headers"]) {
    await fs.writeFile(path.resolve(this.SNAPSHOT_DIR, this.snapshotName(url)), content);
    await this.updateSnapshotMeta(url, name, headers);
  }

  protected async readSnapshotMeta() {
    let meta: SnapshotMeta = { snapshot: { sources: [] } };

    try {
      meta = await fs.readJSON(path.resolve(this.SNAPSHOT_DIR, "__meta.json"));
    } catch (error) {}

    if (!meta.snapshot) meta.snapshot = { sources: [] };
    if (!meta.snapshot.sources) meta.snapshot.sources = [];

    return meta;
  }

  protected async updateSnapshotMeta(url: string, name?: string, headers?: SnapshotDataSource["headers"]) {
    const meta = await this.readSnapshotMeta();

    const sources = meta.snapshot.sources || [];

    const updatingSourceIndex = sources.findIndex((source) => source.url === url);

    if (updatingSourceIndex === -1) sources.push({ name: name || this.suffix(sources.length), url, headers });
    else {
      sources.splice(updatingSourceIndex, 1, {
        ...sources[updatingSourceIndex],
        headers: headers || sources[updatingSourceIndex].headers,
        name: name || sources[updatingSourceIndex].name,
      });
    }

    meta.snapshot.sources = sources;

    await fs.writeJSON(path.resolve(this.SNAPSHOT_DIR, "__meta.json"), meta);
  }

  protected snapshotName(url: string, ext = true) {
    return url.replace(/^https?:\/\//, "").replace(/[\/:?.&=#]/g, "_") + (ext ? ".ts" : "");
  }

  protected suffix(suffix: string | number) {
    return `${this.DEFAULT_TYPE_NAME}${suffix.toString().toUpperCase()}`;
  }

  protected invalidUrl(url: string): boolean {
    try {
      new URL(url);
      return false;
    } catch {
      return true;
    }
  }

  protected invalidJSON(input: string): boolean {
    try {
      JSON.parse(input);
      return false;
    } catch (error) {
      return true;
    }
  }

  protected async modifyGitignoreFile(name: string) {
    try {
      const filepath = path.resolve(CWD, ".gitignore");
      const content = await fs.readFile(filepath, { encoding: "utf8" });

      if (content.split("\n").some((line) => line.trim() === name.trim())) return;

      await fs.appendFile(filepath, `\n${name}`);
    } catch (error) {}
  }
}
