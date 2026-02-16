import express from "express";
import chokidar from "chokidar";
import type { OutgoingHttpHeaders } from "http";
import type { Config } from "./config/config";
import type { ServerCLIOptions } from "./types";
import path from "path";
import { Logger } from "./logger";
import { loadConfig } from "./load-config";
import type { Database } from "./database";
import { CONFIG_FILE_NAME } from "./constants";

type RefreshCallbackOptions = {
  shouldRefresh: boolean;
};

type ReloaderRefreshCallback = (router: express.Router, options: RefreshCallbackOptions) => Promise<Database>;

export class HotReloader {
  private router: express.Router;
  private clients = new Set<express.Response>();

  private _ref: { current: ReloaderRefreshCallback | null } = { current: null };

  private _pingTimer: NodeJS.Timeout | undefined;

  private readonly RELOAD_PATH = "/__reload";

  private readonly headers: OutgoingHttpHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  database: Database | undefined;

  private constructor(
    private readonly app: express.Express,
    private readonly initial: express.Router,
    private readonly config: Config,
    private readonly options: ServerCLIOptions
  ) {
    this.router = this.initial;

    this.middleware = this.middleware.bind(this);

    this.app.use(this.middleware);

    this.app.get(this.RELOAD_PATH, (_, res) => this.subscribe(res));

    this.ping();
  }

  static register(app: express.Express, initial: express.Router, config: Config, options: ServerCLIOptions) {
    return new HotReloader(app, initial, config, options);
  }

  set(newRouter: express.Router) {
    this.router = newRouter;
  }

  subscribe(res: express.Response) {
    res.writeHead(200, this.headers);
    res.write("\n");
    this.clients.add(res);

    res.on("close", () => {
      this.clients.delete(res);
    });
  }

  broadcast() {
    for (const res of this.clients) {
      res.write(`event: reload\ndata: ${Date.now()}\n\n`);
    }
  }

  watch(): () => void {
    const trigger = this.createTrigger();

    const watcher = chokidar.watch(this.watcherPaths(), {
      ignoreInitial: true,
      persistent: true,
      ignorePermissionErrors: true,
      ignored: ["**/*.js", "**/*.jsx", "**/*.json", "**/*.map", "**/*.d.ts", "**/node_modules/**"],
    });

    watcher.on("change", (path) => trigger(path));
    watcher.on("add", () => trigger(null));
    watcher.on("unlink", () => trigger(null));
    watcher.on("unlinkDir", () => trigger(null));

    watcher.on("error", (err) => {
      Logger.error("Hot reloader error ❌. error: %s", err instanceof Error ? err.message : String(err));
    });

    return () => {
      watcher.close();
      this._ref.current = null;

      for (const res of this.clients) {
        try {
          res.end();
        } catch (error) {
          Logger.warn(error instanceof Error ? error.message : String(error));
        }
      }

      this.clients.clear();

      if (this._pingTimer) clearInterval(this._pingTimer);
      this._pingTimer = undefined;

      process.exit(0);
    };
  }

  async onReady(callback: ReloaderRefreshCallback) {
    const nextRouter = express.Router();

    this._ref.current = callback;

    this.database = await callback(nextRouter, { shouldRefresh: false });

    this.set(nextRouter);
  }

  private ping() {
    if (this._pingTimer) return;

    this._pingTimer = setInterval(() => {
      for (const res of this.clients) {
        try {
          res.write(`event: ping\ndata: ${Date.now()}\n\n`);
        } catch {
          this.clients.delete(res);
        }
      }
    }, 25_000);
  }

  private async reload() {
    if (!this._ref.current) return;

    const nextRouter = express.Router();

    const nextDatabase = await this._ref.current(nextRouter, { shouldRefresh: true });

    this.database = nextDatabase;

    this.set(nextRouter);
  }

  static async prepareConfig(config: Config, { shouldRefresh }: RefreshCallbackOptions) {
    if (shouldRefresh) return await loadConfig();

    return config;
  }

  private watcherPaths() {
    const configPath = path.resolve(process.cwd(), CONFIG_FILE_NAME);

    return [...this.config.getSourceFiles(this.options.source), configPath];
  }

  private middleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    return this.router(req, res, next);
  }

  private createTrigger() {
    let timer: NodeJS.Timeout | undefined;
    let running = false;
    let queued = false;

    const trigger = (path: string | null) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (running) {
          queued = true;
          return;
        }

        running = true;
        const start = Date.now();

        if (path) Logger.info("Change detected in %s.", Logger.blue(path));

        try {
          Logger.dim("reloading routes...");
          await this.reload();

          this.broadcast();

          const duration = Date.now() - start;

          Logger.success("Reload completed in %dms ✅", duration);
        } catch (error) {
          Logger.error("Reload failed ❌. error: %s", error instanceof Error ? error.message : String(error));
        } finally {
          running = false;
          if (queued) {
            queued = false;
            trigger(path);
          }
        }
      }, 250);
    };

    return trigger;
  }
}
