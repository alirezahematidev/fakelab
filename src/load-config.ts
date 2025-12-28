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

    const config = await bundleRequire({ filepath });

    return config.mod.default as Config;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    Logger.error("Could not load the config file.");
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Could not load the config file.");
  }
}

export { loadConfig };
