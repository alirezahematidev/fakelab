import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";
import { Logger } from "./logger";
import type { Config } from "./config/conf";
import path from "node:path";

const CONFIG_FILE = "fakelab.config.ts";

interface LoadConfigOptions {
  cwd: string;
}

async function loadConfig({ cwd }: LoadConfigOptions = { cwd: process.cwd() }): Promise<Config> {
  try {
    const joycon = new JoyCon({ cwd });

    let filepath: string | null = path.join(cwd, CONFIG_FILE);

    if (!filepath) {
      filepath = await joycon.resolve({
        files: [CONFIG_FILE],
      });
    }

    if (!filepath) {
      Logger.error("No fakelab config file is detected.");
      throw new Error("No fakelab config file is detected.");
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

    throw error instanceof Error ? error : new Error(message);
  }
}

export { loadConfig };
