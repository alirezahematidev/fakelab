import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import z from "zod";
import { Command } from "commander";
import { startServer } from "./server";
import { loadConfig } from "./load-config";
import { Logger } from "./logger";

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = fs.readJSONSync(path.join(__dirname, "../package.json"));

program.name(pkg.name).description(pkg.description).version(pkg.version);

const optionsSchema = z.object({ source: z.string().optional(), pathPrefix: z.string().optional(), port: z.number().int().optional(), locale: z.string().optional() });

program
  .command("serve")
  .description("start server")
  .option("-s, --source <char>", "config source path")
  .option("-x, --pathPrefix <char>", "server url path prefix")
  .option("-p, --port <number>", "server port number", parseInt)
  .option("-l, --locale <char>", "faker custom locale")
  .action(async (options) => {
    const parsed = await optionsSchema.safeParseAsync(options);

    if (parsed.error) {
      Logger.error(z.treeifyError(parsed.error).errors.join("\n"));
      process.exit(1);
    }

    const config = await loadConfig();
    startServer(config, parsed.data);
  });

program.parse();
