import path from "node:path";
import fs from "fs-extra";
import { Command } from "commander";
import { Server } from "./server";
import { Snapshot } from "./snapshot";
import { fileURLToPath } from "node:url";

const program = new Command();

const dirname = path.dirname(fileURLToPath(import.meta.url));

const pkg = fs.readJSONSync(path.join(dirname, "../package.json"));

program.name(pkg.name).description(pkg.description).version(pkg.version);

program
  .command("serve")
  .description("Start mock server")
  .option("-s, --source <char>", "Config source path")
  .option("-x, --pathPrefix <char>", "Server url path prefix")
  .option("-p, --port <number>", "Server port number", parseInt)
  .option("-l, --locale <char>", "Faker custom locale")
  .option("-h, --headless", "Headless mode")
  .option("-t, --ts-config-path <char>", "Typescript config file path", "tsconfig.json")
  .option("-f, --fresh-snapshots", "Capture or refresh all snapshots")
  .action(async (options) => {
    const snapshot = await Snapshot.prepare(options);

    Server.init(options, snapshot.config).start();
  });
program
  .command("snapshot")
  .description("Capture a url response to a fakelab entity")
  .argument("[string]", "Url to capture")
  .option("-s, --name <string>", "Specify snapshot source name")
  .option("-r, --refresh <string>", "Refresh the specified snapshot")
  .option("-d, --delete <string>", "Delete the specified snapshot")
  .action(async (url, options) => {
    const snapshot = await Snapshot.init(options);

    snapshot.capture(url);
  });

program.parse();
