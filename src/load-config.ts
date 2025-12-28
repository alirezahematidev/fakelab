import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";
import { Logger } from "./logger";
import type { Config } from "./config/conf";
import path from "node:path";
import fs from "fs-extra";
import { CWD } from "./file";

const CONFIG_FILE = "fakelab.config.ts";

async function loadConfig(): Promise<Config> {
  try {
    const joycon = new JoyCon();

    const filepath = await joycon.resolve({
      files: [CONFIG_FILE],
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

    const config = await bundleRequire({
      filepath: normalizedPath,
      cwd: CWD,
    });

    return config.mod.default as Config;
  } catch (error) {
    if (error instanceof Error && error.stack) {
      Logger.debug("Stack trace: %s", error.stack);
    }

    throw error;
  }
}

export { loadConfig };
