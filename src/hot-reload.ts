import express from "express";
import chokidar from "chokidar";

type HotReloaderStartOptions = {
  paths: string[];
  onChange(): Promise<void>;
  onError(error: unknown): void;
};

export class HotReloader {
  private router: express.Router;
  private clients = new Set<express.Response>();

  constructor(initial: express.Router) {
    this.router = initial;

    this.middleware = this.middleware.bind(this);
  }

  set(newRouter: express.Router) {
    this.router = newRouter;
  }

  middleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    return this.router(req, res, next);
  }

  subscribe(res: express.Response) {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    res.write("\n");
    this.clients.add(res);

    res.on("close", () => {
      this.clients.delete(res);
    });
  }

  broadcast() {
    for (const res of this.clients) {
      res.write(`event: reload\ndata now\n\n`);
    }
  }

  start(options: HotReloaderStartOptions) {
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
        try {
          await options.onChange();
        } catch (error) {
          options.onError(error);
        } finally {
          running = false;
          if (queued) {
            queued = false;
            trigger();
          }
        }
      }, 200);
    };

    const watcher = chokidar.watch(options.paths, {
      ignoreInitial: true,
      ignored: (filename) => {
        return filename.includes("node_modules") || filename.includes(".git") || filename.includes(".fakelab");
      },
    });

    watcher.on("all", trigger);

    return () => watcher.close();
  }
}
