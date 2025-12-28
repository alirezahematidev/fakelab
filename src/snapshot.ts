import fs from "fs-extra";
import { Logger } from "./logger";
import path from "node:path";
import { loadConfig } from "./load-config";
import type { SnapshotCLIOptions, SnapshotDataSource, SnapshotPrepareOptions, SnapshotSchema, SnapshotUpdateArgs } from "./types";
import { CWD } from "./file";
import type { Config } from "./config/conf";
import { EventSubscriber } from "./events";
import { Webhook } from "./webhook";

export class Snapshot {
  readonly TARGET_LANGUAGE = "typescript";
  readonly DEFAULT_TYPE_NAME = "Fakelab";
  readonly SNAPSHOT_DIR = path.resolve(CWD, ".fakelab/snapshots");

  private history: Set<string> = new Set();

  private static _instance: Snapshot;

  private subscriber: EventSubscriber | undefined;

  private webhook: Webhook | undefined;

  private constructor(private readonly options: SnapshotCLIOptions, private readonly config: Config) {
    this.capture = this.capture.bind(this);
    this.__expose = this.__expose.bind(this);

    this.tryInitializeWebhook();
  }

  public __expose() {
    return {
      config: this.config,
      webhook: this.webhook,
    };
  }

  static async init(options: SnapshotCLIOptions) {
    try {
      const config = await loadConfig();

      if (!this._instance) this._instance = new Snapshot(options, config);

      if (this._instance.webhook) this._instance.webhook.activate();

      return this._instance;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      process.exit(1);
    }
  }

  static async prepare(options: SnapshotPrepareOptions) {
    try {
      const config = await loadConfig();

      const instance = this._instance || new Snapshot({}, config);

      const { enabled, sources } = config.options.snapshot();

      if (instance.webhook) instance.webhook.activate();

      if (enabled && options.freshSnapshots) {
        await instance.updateAll(sources, true);
      }

      return instance;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      process.exit(1);
    }
  }

  async capture(url: string | undefined) {
    const { enabled, sources } = this.config.options.snapshot();

    if (!enabled) return;

    await fs.ensureDir(this.SNAPSHOT_DIR);
    await fs.ensureFile(path.resolve(this.SNAPSHOT_DIR, "__schema.json"));

    const schema = await this.readSnapshotSchema();

    if (await this.duplicateExists(schema)) {
      Logger.error("Snapshot source names must be unique.");
      process.exit(1);
    }

    if (!url) {
      if (this.options.refresh) {
        return await this.refresh(sources, this.options.refresh, schema);
      }

      if (this.options.delete) {
        return await this.delete(sources, this.options.delete, schema);
      }

      return await this.updateAll(sources);
    }

    const defaultName = this.suffix(schema.sources);

    if (this.options?.refresh) {
      Logger.warn("--refresh flag has no effect when used with url. Refresh skipped.");
    }

    if (this.options?.delete) {
      Logger.warn("--delete flag has no effect when used with url. Delete skipped.");
    }

    const content = await this.fetch({ url, name: this.options?.name || defaultName });
    await this.save({ url, name: this.options?.name || defaultName }, content, schema);

    await this.modifyGitignoreFile(".fakelab/*");
  }

  private async save(source: SnapshotDataSource, content: string, schema: SnapshotSchema) {
    try {
      const capturedSource = schema.sources.find((s) => s.url === source.url);

      if (capturedSource) {
        Logger.warn("%s snapshot is already captured. Use \x1b[36mnpx fakelab snapshot --refresh %s\x1b[0m to update.", source.url, capturedSource.name);
        return;
      }

      const capturingName = this.snapshotName(source.url, false);

      Logger.info("Capturing %s snapshot...", capturingName);
      if (!(source.name || this.options?.name)) {
        Logger.warn("Snapshot source name not found. Auto-generating a name.");
      }

      await this.write(source.url, content, source.name || this.options?.name);

      this.subscriber?.snapshot.captured({ url: source.url, name: source.name ?? this.options?.name, content });

      Logger.success("Snapshot %s captured successfully.", Logger.blue(capturingName));
    } catch (error) {
      console.log({ error });
    }
  }

  private async refresh(sources: SnapshotDataSource[], name: string, schema: SnapshotSchema) {
    let source = sources.find((source) => source.name === name.trim());

    if (!source) {
      source = (schema.sources || []).find((source) => source.name === name);
    }

    if (!source) {
      Logger.warn("Snapshot source not found. Refresh skipped.");
      return;
    }

    Logger.info("Refreshing %s snapshot source...", Logger.blue(source.name));

    const filepath = path.resolve(this.SNAPSHOT_DIR, this.snapshotName(source.url));

    const exists = await fs.exists(filepath);

    if (exists) {
      const content = await this.fetch(source);
      this.subscriber?.snapshot.refreshed({ url: source.url, name: source.name ?? this.options?.name, content });
      await fs.writeFile(filepath, content);
    } else {
      const content = await this.fetch(source);
      this.subscriber?.snapshot.refreshed({ url: source.url, name: source.name ?? this.options?.name, content });
      await this.save(source, content, schema);
    }

    Logger.success("Snapshot source %s refreshed successfully.", Logger.blue(source.name));
  }

  private async delete(sources: SnapshotDataSource[], name: string, schema: SnapshotSchema) {
    let source = sources.find((source) => source.name === name.trim());

    if (!source) {
      source = (schema.sources || []).find((source) => source.name === name);
    }

    if (!source) {
      Logger.warn("Snapshot source not found. Delete skipped.");
      return;
    }

    Logger.info("Deleting %s snapshot source...", Logger.blue(source.name));

    const filepath = path.resolve(this.SNAPSHOT_DIR, this.snapshotName(source.url));

    await fs.rm(filepath, { force: true });
    await this.updateSnapshotSchema({ url: source.url, delete: true });

    this.subscriber?.snapshot.deleted({ url: source.url, name: source.name ?? this.options?.name });

    Logger.success("Snapshot source %s deleted successfully.", Logger.blue(source.name));
  }

  private async updateAll(sources: SnapshotDataSource[], serve = false) {
    Logger.info(serve ? "Refreshing all snapshots..." : "Updating all snapshots...");

    const schema = await this.readSnapshotSchema();

    try {
      await Promise.all(
        sources.map(async (source) => {
          const filepath = path.resolve(this.SNAPSHOT_DIR, this.snapshotName(source.url));

          const exists = await fs.exists(filepath);

          if (exists) {
            const content = await this.fetch(source);
            await fs.writeFile(filepath, content);
          } else {
            const content = await this.fetch(source);
            await this.save(source, content, schema);
          }
        })
      );
      Logger.success("All snapshots are updated.");
    } catch (error) {
      Logger.error("Failed to update.", error);
      process.exit(1);
    }
  }

  private async fetch({ name, url, headers }: SnapshotDataSource): Promise<string> {
    if (!this.isValidUrl(url)) {
      Logger.error("Invalid snapshot URL. Please provide a valid http URL.");
      process.exit(1);
    }

    const response = await fetch(url, { headers });

    const input = await response.text();

    if (!this.isValidJSON(input)) {
      Logger.error("Invalid snapshot response format. Expected JSON but received non-JSON data.");
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

  private async write(url: string, content: string, name?: string, headers?: SnapshotDataSource["headers"]) {
    await fs.writeFile(path.resolve(this.SNAPSHOT_DIR, this.snapshotName(url)), content);
    await this.updateSnapshotSchema({ url, name, headers });
  }

  private async readSnapshotSchema() {
    let schema: SnapshotSchema = { sources: [] };

    try {
      schema = await fs.readJSON(path.resolve(this.SNAPSHOT_DIR, "__schema.json"));
    } catch (error) {
      Logger.warn("Cannot read snapshot __schema file. error: %s", error);
    }

    if (!schema.sources) schema.sources = [];

    return schema;
  }

  private async updateSnapshotSchema(args: SnapshotUpdateArgs) {
    const schema = await this.readSnapshotSchema();

    const sources = schema.sources || [];
    const sourceIndex = sources.findIndex((source) => source.url === args.url);

    if (args.delete) {
      sources.splice(sourceIndex, 1);
    } else {
      if (sourceIndex === -1) sources.push({ ...args, name: args.name || this.suffix(sources) });
      else {
        const sourceName = sources[sourceIndex].name;
        const sourceHeaders = sources[sourceIndex].headers;

        sources.splice(sourceIndex, 1, { ...sources[sourceIndex], name: args.name || sourceName, headers: args.headers || sourceHeaders });
      }
    }

    schema.sources = sources;

    await fs.writeJSON(path.resolve(this.SNAPSHOT_DIR, "__schema.json"), schema);
  }

  private tryInitializeWebhook() {
    const { enabled } = this.config.options.snapshot();

    if (enabled) {
      const opts = this.config.options.webhook();
      if (opts.enabled) {
        this.subscriber = new EventSubscriber(opts.hooks);

        this.webhook = new Webhook(this.subscriber, this.config, this.history);
      } else {
        Logger.warn("Webhook is disabled. Skipping initialization.");
      }
    }
  }

  private snapshotName(url: string, ext = true) {
    return url.replace(/^https?:\/\//, "").replace(/[/:?.&=#]/g, "_") + (ext ? ".ts" : "");
  }

  private suffix<S extends { name: string }>(sources: S[]) {
    const suffixedSources = sources.filter((source) => source.name.startsWith(this.DEFAULT_TYPE_NAME));

    return `${this.DEFAULT_TYPE_NAME}${suffixedSources.length}`;
  }

  private isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);

      if (u.protocol !== "http:" && u.protocol !== "https:") return false;

      return true;
    } catch {
      return false;
    }
  }

  private isValidJSON(input: string): boolean {
    try {
      JSON.parse(input);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }

  private async duplicateExists(schema: SnapshotSchema) {
    const sources = schema.sources.map((source) => source.name);

    return new Set(sources).size !== sources.length;
  }

  private async modifyGitignoreFile(name: string) {
    try {
      const filepath = path.resolve(CWD, ".gitignore");
      const content = await fs.readFile(filepath, { encoding: "utf8" });

      if (content.split("\n").some((line) => line.trim() === name.trim())) return;

      await fs.appendFile(filepath, `\n${name}`);
    } catch (error) {
      Logger.warn("Cannot modify .gitignore. error: %s", error);
    }
  }
}
