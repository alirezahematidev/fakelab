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
      process.exit(1);
    }

    const config = await bundleRequire({ filepath });

    return config.mod.default as Config;
  } catch (error) {
    Logger.error("Could not load the config file.");
    process.exit(1);
  }
}

export { loadConfig };
