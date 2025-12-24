import express from "express";
import cors from "cors";
import path from "node:path";
import ejsLayouts from "express-ejs-layouts";
import http from "http";
import { RouteRegistry } from "./registry";
import figlet from "figlet";
import { Logger } from "./logger";
import { DIRNAME } from "./file";
import { Network } from "./network";
import { loadConfig } from "./load-config";
import type { Config } from "./config/conf";
import type { ServerCLIOptions } from "./types";
import { Database } from "./database";

export class Server {
  private constructor(private readonly serverCLIOptions: ServerCLIOptions) {
    this.start = this.start.bind(this);
    this.xPoweredMiddleware = this.xPoweredMiddleware.bind(this);
    this.setupApplication = this.setupApplication.bind(this);
    this.setupTemplateEngine = this.setupTemplateEngine.bind(this);

    this.loadLocalEnv();
  }

  public static init(options: ServerCLIOptions) {
    return new Server(options);
  }

  public async start() {
    const app = express();

    const router = express.Router();

    const server = http.createServer(app);

    const config = await loadConfig();

    const network = Network.initHandlers(config);

    const database = Database.register(config);

    this.setupApplication(app, network);

    this.setupTemplateEngine(app);

    await config.generateInFileRuntimeConfig(DIRNAME, this.serverCLIOptions);

    await database.initialize();

    const registry = new RouteRegistry(router, config, network, database, this.serverCLIOptions);

    await registry.register();

    app.use(router);

    this.run(server, config, database, this.serverCLIOptions);
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

  private run(server: http.Server, config: Config, database: Database, options: ServerCLIOptions) {
    const { port } = config.options.server(options.pathPrefix, options.port);

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
