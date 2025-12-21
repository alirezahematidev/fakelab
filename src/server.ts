import express from "express";
import cors from "cors";
import path from "node:path";
import ejsLayouts from "express-ejs-layouts";
import http from "http";
import "ejs";
import { RouteRegistry } from "./registry";
import figlet from "figlet";
import { Logger } from "./logger";
import type { ServerCLIOptions } from "./types";
import type { Config } from "./config/conf";
import { DIRNAME } from "./file";
import { Network } from "./network";

function listenCallback(config: Config, port: number) {
  try {
    process.loadEnvFile("./.env.local");
  } catch (error) {}

  if (config.databaseEnabled()) Logger.info(`database: ${config.getDatabaseDirectoryPath()}`);
  Logger.info(`server: http://localhost:${port}`);
  console.log(figlet.textSync("FAKELAB"));
}

function run(server: http.Server, config: Config, options: ServerCLIOptions) {
  const { port } = config.serverOpts(options.pathPrefix, options.port);

  server.listen(port, "localhost", () => listenCallback(config, port));

  server.on("close", () => {
    Logger.close();
  });
}

function xPoweredMiddleware(_: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader("x-powered-by", "fakelab");
  next();
}

function setupApplication(app: express.Express, network: Network) {
  app.disable("x-powered-by");
  app.use(express.json());
  app.use(cors({ methods: "GET" }));
  app.use(express.static(DIRNAME + "/public"));
  app.use(xPoweredMiddleware);
  app.use(network.middleware);
}

function setupTemplateEngine(app: express.Express) {
  app.set("views", path.join(DIRNAME, "views"));
  app.set("view engine", "ejs");

  app.use(ejsLayouts);
  app.set("layout", "layouts/main");
}

async function startServer(config: Config, options: ServerCLIOptions) {
  const app = express();
  const router = express.Router();

  const server = http.createServer(app);

  const network = Network.initHandlers(config);

  setupApplication(app, network);

  setupTemplateEngine(app);

  await config.generateInFileRuntimeConfig(DIRNAME, options);

  const registry = new RouteRegistry(router, config, options, network);

  await registry.register();

  app.use(router);

  run(server, config, options);
}

export { startServer };
