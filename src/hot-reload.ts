import express from "express";
import chokidar from "chokidar";
import type { OutgoingHttpHeaders } from "http";
import type { Config } from "./config/conf";
import type { ServerCLIOptions } from "./types";
import path from "path";
import { CWD } from "./file";
import { Logger } from "./logger";
import { loadConfig } from "./load-config";
import type { Database } from "./database";

type ReloaderRefreshCallback = (router: express.Router, reloaded: boolean) => Promise<Database>;

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

  watch() {
    const trigger = this.createTrigger();

    const watcher = chokidar.watch(this.watcherPaths(), {
      ignoreInitial: true,
      persistent: true,
      ignorePermissionErrors: true,
      ignored: ["**/*.js", "**/*.jsx", "**/*.json", "**/*.map", "**/*.d.ts", "**/node_modules/**"],
    });

    watcher.on("add", trigger);
    watcher.on("change", trigger);
    watcher.on("unlink", trigger);
    watcher.on("unlinkDir", trigger);
    watcher.on("error", (err) => {
      Logger.error("Hot reload: watcher error ❌. error: %s", err instanceof Error ? err.message : String(err));
    });

    return () => {
      watcher.close();
      this._ref.current = null;

      for (const res of this.clients) {
        try {
          res.end();
        } catch {
          //
        }
      }

      this.clients.clear();

      if (this._pingTimer) clearInterval(this._pingTimer);
      this._pingTimer = undefined;
    };
  }

  async onReady(callback: ReloaderRefreshCallback) {
    const nextRouter = express.Router();

    this._ref.current = callback;

    this.database = await callback(nextRouter, false);

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

    const nextDatabase = await this._ref.current(nextRouter, true);

    this.database = nextDatabase;

    this.set(nextRouter);
  }

  async prepareConfig(config: Config, fresh: boolean) {
    if (fresh) return await loadConfig();

    return config;
  }

  private watcherPaths() {
    const configPath = path.resolve(CWD, "fakelab.config.ts");

    return [...this.config.getSourceFiles(this.options.source), configPath];
  }

  private middleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    return this.router(req, res, next);
  }

  private createTrigger() {
    let timer: NodeJS.Timeout | undefined;
    let running = false;
    let queued = false;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (running) {
          queued = true;
          return;
        }

        running = true;
        const start = Date.now();

        Logger.info("Hot reload: change detected.");

        try {
          Logger.info("Hot reload: rebuilding routes...");
          await this.reload();

          this.broadcast();

          const duration = Date.now() - start;

          Logger.success("Hot reload: completed in %dms ✅", duration);
        } catch (error) {
          Logger.error("Hot reload: rebuild failed ❌. error: %s", error instanceof Error ? error.message : String(error));
        } finally {
          running = false;
          if (queued) {
            queued = false;
            trigger();
          }
        }
      }, 250);
    };

    return trigger;
  }
}
