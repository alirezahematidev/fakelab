import express from "express";
import cors from "cors";
import path from "node:path";
import http from "http";
import ejsLayouts from "express-ejs-layouts";
import { RouteRegistry } from "./registry";
import figlet from "figlet";
import { Logger } from "./logger";
import { DIRNAME } from "./file";
import { Network } from "./network";
import type { Config } from "./config/conf";
import type { ServerCLIOptions, ServerOptions } from "./types";
import { Webhook } from "./webhook";
import { ServerEventSubscriber } from "./events/subscribers";
import type { ServerEvent, ServerEventArgs } from "./events/types";
import { Headless } from "./headless";
import { Database } from "./database";
import { HotReloader } from "./hot-reload";

export class Server {
  private webhook: Webhook<ServerEvent, ServerEventArgs> | undefined;
  private subscriber: ServerEventSubscriber | undefined;

  private constructor(private readonly options: ServerCLIOptions, private readonly config: Config) {
    this.start = this.start.bind(this);
    this.xPoweredMiddleware = this.xPoweredMiddleware.bind(this);
    this.setupApplication = this.setupApplication.bind(this);
    this.setupTemplateEngine = this.setupTemplateEngine.bind(this);

    this.loadLocalEnv();

    this.initWebhook();

    process.on("SIGINT", () => {
      const opts = this.config.options.server(this.options.pathPrefix, this.options.port);
      this.subscriber?.shutdown(opts);
      process.exit(0);
    });
  }

  private initWebhook() {
    const opts = this.config.options.webhook();

    if (opts.enabled) {
      if (!this.config.enabled()) {
        Logger.warn("Fakelab is disabled. Skipped webhook initialization.");
        return;
      }
      this.subscriber = new ServerEventSubscriber();

      Logger.warn("Initializating webhook...");

      this.webhook = new Webhook(this.subscriber, this.config);
    }
  }

  public static init(options: ServerCLIOptions, config: Config) {
    const server = new Server(options, config);

    if (server.webhook && !server.webhook.isActivated()) {
      server.webhook.activate();
    }

    return server;
  }

  private async shouldRunHeadlessMode() {
    if (this.options.headless || this.config.isHeadless()) {
      const headless = new Headless(this.config);
      const canGenerate = await headless.generate(this.options);

      if (!canGenerate) {
        Logger.error("Headless mode failed. Falling back to standard server mode.");
      }

      return canGenerate;
    }

    return false;
  }

  public async start() {
    if (await this.shouldRunHeadlessMode()) {
      Logger.info("Headless mode enabled. Server startup skipped.");

      return;
    }

    const app = express();

    const router = express.Router();

    const server = http.createServer(app);

    this.setupApplication(app);

    this.setupTemplateEngine(app);

    await this.config.initializeRuntimeConfig(DIRNAME, this.options);

    const reloader = HotReloader.register(app, router, this.config, this.options);

    await reloader.onReady(async (_router, fresh) => {
      await this.config.initializeRuntimeConfig(DIRNAME, this.options);

      const config = await reloader.prepareConfig(this.config, fresh);

      const network = Network.initHandlers(config);

      const database = Database.register(config);

      await database.initialize();

      const registry = new RouteRegistry(_router, config, network, database, this.options);

      await registry.register({ fresh });

      return database;
    });

    const unwatch = reloader.watch();

    process.on("SIGINT", unwatch);

    if (reloader.database) {
      this.run(server, reloader.database, this.options);
    }
  }

  private setupApplication(app: express.Express) {
    app.disable("x-powered-by");
    app.use(express.json());
    app.use(cors({ methods: ["GET", "POST", "OPTIONS"] }));
    app.use(express.static(DIRNAME + "/public"));
    app.use(this.xPoweredMiddleware);
  }

  private setupTemplateEngine(app: express.Express) {
    app.set("views", path.join(DIRNAME, "views"));
    app.set("view engine", "ejs");
    app.use(ejsLayouts);
    app.set("layout", "layouts/main");
  }

  private listen(database: Database, opts: Required<ServerOptions>) {
    this.subscriber?.started(opts);

    if (database.enabled() && this.config.enabled()) Logger.info(`database: %s`, Database.DATABASE_DIR);

    Logger.info(`Server%s listening at http://localhost:%d`, !this.config.enabled() ? "(disabled)" : "", opts.port);

    if (this.config.enabled()) {
      console.log(figlet.textSync("FAKELAB"));
    }
  }

  private run(server: http.Server, database: Database, options: ServerCLIOptions) {
    const opts = this.config.options.server(options.pathPrefix, options.port);

    server.listen(opts.port, "localhost", () => this.listen(database, opts));
  }

  private xPoweredMiddleware(_: express.Request, res: express.Response, next: express.NextFunction) {
    res.setHeader("x-powered-by", "fakelab");
    next();
  }

  private loadLocalEnv() {
    try {
      if (process.env.NODE_ENV === "development") {
        process.loadEnvFile("./.env.local");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        Logger.warn("Cannot load .env.local file for debugging. error: %s", error);
      }
    }
  }
}
