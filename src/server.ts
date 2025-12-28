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
import { Database } from "./database";
import { Webhook } from "./webhook";
import { EventSubscriber } from "./events";

type ServerBorrowedConfig = { config: Config; webhook: Webhook | undefined };

export class Server {
  private history: Set<string> = new Set();

  private webhook: Webhook | undefined;
  private subscriber: EventSubscriber | undefined;

  private constructor(private readonly serverCLIOptions: ServerCLIOptions, private readonly borrowedConfig: ServerBorrowedConfig) {
    this.start = this.start.bind(this);
    this.xPoweredMiddleware = this.xPoweredMiddleware.bind(this);
    this.setupApplication = this.setupApplication.bind(this);
    this.setupTemplateEngine = this.setupTemplateEngine.bind(this);

    this.loadLocalEnv();

    this.tryInitializeWebhook();

    process.on("SIGINT", () => {
      const opts = this.borrowedConfig.config.options.server(this.serverCLIOptions.pathPrefix, this.serverCLIOptions.port);
      this.subscriber?.server.shutdown(opts);
      process.exit(0);
    });
  }

  private tryInitializeWebhook() {
    const opts = this.borrowedConfig.config.options.webhook();

    if (opts.enabled) {
      this.subscriber = new EventSubscriber();

      Logger.warn("Initializating webhook...");

      this.webhook = this.borrowedConfig.webhook || new Webhook(this.subscriber, this.borrowedConfig.config, this.history);
    }
  }

  public static init(options: ServerCLIOptions, borrowedConfig: ServerBorrowedConfig) {
    const instance = new Server(options, borrowedConfig);

    if (instance.webhook && !instance.webhook.isActivated()) {
      instance.webhook.activate();
    }

    return instance;
  }

  public async start() {
    const app = express();

    const router = express.Router();

    const server = http.createServer(app);

    const network = Network.initHandlers(this.borrowedConfig.config);

    const database = Database.register(this.borrowedConfig.config);

    this.setupApplication(app, network);

    this.setupTemplateEngine(app);

    await this.borrowedConfig.config.initializeRuntimeConfig(DIRNAME, this.serverCLIOptions);

    await database.initialize();

    const registry = new RouteRegistry(router, this.borrowedConfig.config, network, database, this.serverCLIOptions);

    await registry.register();

    app.use(router);

    this.run(server, database, this.serverCLIOptions);
  }

  private setupApplication(app: express.Express, network: Network) {
    app.disable("x-powered-by");
    app.use(express.json());
    app.use(cors({ methods: "GET" }));
    app.use(express.static(DIRNAME + "/public"));
    app.use(this.xPoweredMiddleware);
    app.use(network.middleware);
  }

  private setupTemplateEngine(app: express.Express) {
    app.set("views", path.join(DIRNAME, "views"));
    app.set("view engine", "ejs");

    app.use(ejsLayouts);
    app.set("layout", "layouts/main");
  }

  private listen(database: Database, opts: Required<ServerOptions>) {
    this.subscriber?.server.started(opts);

    if (database.enabled()) Logger.info(`database: %s`, database.DATABASE_DIR);

    Logger.info(`Server listening to http://localhost:%d`, opts.port);

    console.log(figlet.textSync("FAKELAB"));
  }

  private run(server: http.Server, database: Database, options: ServerCLIOptions) {
    const opts = this.borrowedConfig.config.options.server(options.pathPrefix, options.port);

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
