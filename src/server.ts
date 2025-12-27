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
import type { ServerCLIOptions } from "./types";
import { Database } from "./database";

export class Server {
  private constructor(private readonly serverCLIOptions: ServerCLIOptions, private readonly config: Config) {
    this.start = this.start.bind(this);
    this.xPoweredMiddleware = this.xPoweredMiddleware.bind(this);
    this.setupApplication = this.setupApplication.bind(this);
    this.setupTemplateEngine = this.setupTemplateEngine.bind(this);

    this.loadLocalEnv();
  }

  public static init(options: ServerCLIOptions, config: Config) {
    return new Server(options, config);
  }

  public async start() {
    const app = express();

    const router = express.Router();

    const server = http.createServer(app);

    const network = Network.initHandlers(this.config);

    const database = Database.register(this.config);

    this.setupApplication(app, network);

    this.setupTemplateEngine(app);

    await this.config.initializeRuntimeConfig(DIRNAME, this.serverCLIOptions);

    await database.initialize();

    const registry = new RouteRegistry(router, this.config, network, database, this.serverCLIOptions);

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

  private listen(database: Database, port: number) {
    if (database.enabled()) Logger.info(`database: %s`, database.DATABASE_DIR);

    Logger.info(`server listening to http://localhost:%d`, port);

    console.log(figlet.textSync("FAKELAB"));
  }

  private run(server: http.Server, database: Database, options: ServerCLIOptions) {
    const { port } = this.config.options.server(options.pathPrefix, options.port);

    server.listen(port, "localhost", () => this.listen(database, port));
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
    } catch (error) {}
  }
}
