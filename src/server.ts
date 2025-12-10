import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type UserConfig } from "./config";
import ejsLayouts from "express-ejs-layouts";
import http from "http";
import "ejs";
import { RouteRegistry } from "./registry";
import figlet from "figlet";
import { Logger } from "./logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(server: http.Server, config: UserConfig) {
  const port = config.serverOptions.port;

  server.listen(port, "localhost", async () => {
    Logger.info(`Server: http://localhost:${port}`);
    console.log(await figlet.text("FAKELAB"));
  });
}

function xPoweredMiddleware(_: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader("x-powered-by", "fakelab");
  next();
}

function setupApplication(app: express.Express) {
  app.disable("x-powered-by");
  app.use(express.json());
  app.use(cors({ methods: "GET" }));
  app.use(express.static(__dirname + "/public"));
  app.use(xPoweredMiddleware);
}

function setupTemplateEngine(app: express.Express) {
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");

  app.use(ejsLayouts);
  app.set("layout", "layouts/main");
}

async function startServer(config: UserConfig) {
  const app = express();
  const router = express.Router();

  const server = http.createServer(app);

  setupApplication(app);

  setupTemplateEngine(app);

  const registry = new RouteRegistry(router, config);

  await registry.register();

  app.use(router);

  run(server, config);
}

export { startServer };
