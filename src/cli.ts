import path from "node:path";
import fs from "fs-extra";
import { Command } from "commander";
import { Server } from "./server";
import { DIRNAME } from "./file";

const program = new Command();

const pkg = fs.readJSONSync(path.join(DIRNAME, "../package.json"));

program.name(pkg.name).description(pkg.description).version(pkg.version);

program
  .command("serve")
  .description("start server")
  .option("-s, --source <char>", "config source path")
  .option("-x, --pathPrefix <char>", "server url path prefix")
  .option("-p, --port <number>", "server port number", parseInt)
  .option("-l, --locale <char>", "faker custom locale")
  .action(async (options) => {
    Server.init(options).start();
  });

program.parse();
