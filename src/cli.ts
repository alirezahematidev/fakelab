import { Command } from "commander";
import { startServer } from "./server";
import { getConfig } from "./config";

const program = new Command();

program.name("falekab").description("CLI to generate mock data").version("0.0.0");

program
  .command("serve")
  .description("start server")
  .action(async () => {
    const config = await getConfig();
    startServer(config);
  });

program.parse();
