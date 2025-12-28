import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";
import { Logger } from "./logger";
import type { Config } from "./config/conf";

const CONFIG_FILE = "fakelab.config.ts";

interface LoadConfigOptions {
  cwd: string;
}

async function loadConfig({ cwd }: LoadConfigOptions = { cwd: process.cwd() }): Promise<Config> {
  try {
    const joycon = new JoyCon({ cwd });

    const filepath = await joycon.resolve({
      files: [CONFIG_FILE],
    });

    if (!filepath) {
      Logger.error("No fakelab config file is detected.");
      process.exit(1);
    }

    const config = await bundleRequire({
      filepath,
    });

    return config.mod.default as Config;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    Logger.error("Could not load the config file: %s", message);

    if (error instanceof Error && error.stack) {
      Logger.debug("Stack trace: %s", error.stack);
    }

    process.exit(1);
  }
}

export { loadConfig };
