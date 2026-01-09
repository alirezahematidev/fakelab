import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";
import { Logger } from "./logger";
import type { Config } from "./config/config";
import path from "node:path";
import fs from "fs-extra";
import { CWD } from "./file";
import { CONFIG_FILE_NAME } from "./constants";

async function loadConfig(): Promise<Config> {
  try {
    const joycon = new JoyCon();

    const filepath = await joycon.resolve({
      files: [CONFIG_FILE_NAME],
    });

    if (!filepath) {
      const error = new Error("No fakelab config file is detected.");
      throw error;
    }

    const normalizedPath = path.resolve(filepath);
    if (!(await fs.pathExists(normalizedPath))) {
      const error = new Error(`Config file not found: ${normalizedPath}`);
      throw error;
    }

    const configModule = await bundleRequire({
      filepath: normalizedPath,
      cwd: CWD,
    });

    return configModule.mod.default as Config;
  } catch (error) {
    if (error instanceof Error && error.stack) {
      Logger.debug("Stack trace: %s", error.stack);
    }

    throw error;
  }
}

export { loadConfig };
