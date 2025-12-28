import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";
import { Logger } from "./logger";
import type { Config } from "./config/conf";

async function loadConfig(): Promise<Config> {
  try {
    const joycon = new JoyCon();

    const filepath = await joycon.resolve({
      files: ["fakelab.config.ts"],
    });

    if (!filepath) {
      Logger.error("No fakelab config file is detected.");
      throw new Error("No fakelab config file is detected.");
    }

    const config = await bundleRequire({
      filepath,
    });

    return config.mod.default as Config;
  } catch (error) {
    if (error instanceof Error) {
      Logger.error("Could not load the config file: %s", error.message);
      if (error.stack) {
        Logger.debug("Stack trace: %s", error.stack);
      }
      process.exit(1);
    }
    Logger.error("Could not load the config file.");
    process.exit(1);
  }
}

export { loadConfig };
