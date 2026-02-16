import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";
import type { Config } from "./config/config";
import path from "node:path";
import fs from "fs-extra";
import { CONFIG_FILE_NAME } from "./constants";

async function loadConfig(): Promise<Config> {
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
    cwd: process.cwd(),
  });

  return configModule.mod.default as Config;
}

export { loadConfig };
