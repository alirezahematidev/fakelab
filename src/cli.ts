import path from "node:path";
import fs from "fs-extra";
import { Command } from "commander";
import { Server } from "./server";
import { DIRNAME } from "./file";
import { Snapshot } from "./snapshot";

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
  .option("-f, --fresh-snapshots", "capture or refresh all snapshots")
  .action(async (options) => {
    const snapshot = await Snapshot.prepare(options);

    Server.init(options, snapshot.__expose()).start();
  });
program
  .command("snapshot")
  .description("capture a url response to a fakelab entity")
  .argument("[string]", "url to capture")
  .option("-s, --source <string>", "specify snapshot source name")
  .option("-r, --refresh <string>", "refresh the specified snapshot")
  .option("-d, --delete <string>", "delete the specified snapshot")
  .action(async (url, options) => {
    const snapshot = await Snapshot.init(options);

    snapshot.capture(url);
  });

program.parse();
