import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import { Logger } from "./logger";
import type { Config } from "./config/conf";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(DIRNAME, "..");

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

    // Resolve "fakelab" to source files when package isn't built (e.g., in tests)
    const configDir = path.dirname(filepath);
    const sourceMainPath = path.resolve(PACKAGE_ROOT, "src", "main.ts");
    const builtMainPath = path.resolve(PACKAGE_ROOT, "lib", "main.js");

    // Check if built version exists, otherwise use source
    const fakelabPath = (await fs.pathExists(builtMainPath)) ? builtMainPath : sourceMainPath;

    const config = await bundleRequire({
      filepath,
      cwd: configDir,
      format: "esm",
      esbuildOptions: {
        alias: {
          fakelab: fakelabPath,
        },
      },
    });

    return config.mod.default as Config;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    if (error instanceof Error) {
      Logger.error("Could not load the config file: %s", error.message);
      if (error.stack) {
        Logger.debug("Stack trace: %s", error.stack);
      }
      throw error;
    }
    Logger.error("Could not load the config file.");
    throw new Error("Could not load the config file.");
  }
}

export { loadConfig };
