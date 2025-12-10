import { bundleRequire } from "bundle-require";
import JoyCon from "joycon";
import glob from "fast-glob";
import fse from "fs-extra";
import path from "node:path";
import { access, constants, stat } from "node:fs/promises";
import type { FakerLocale } from "./types";
import { Constants } from "./constants";
import { Logger } from "./logger";

type ServerOptions = {
  /**
   * @default 5200
   */
  port?: number;
  /**
   * @default `api`
   */
  pathPrefix?: string;
};

type FakerEngineOptions = {
  locale?: FakerLocale;
};

type ConfigOptions = {
  sourcePath: string;
  server?: ServerOptions;
  faker?: FakerEngineOptions;
};

type UserConfig = {
  files: string[];
  serverOptions: Required<ServerOptions>;
  fakerOptions: Required<FakerEngineOptions>;
};

const TYPESCRIPT_EXTENSION = ".ts";

async function validateSourcePath(path: string) {
  if (path.endsWith(TYPESCRIPT_EXTENSION)) return path;
  const predictedPath = path + TYPESCRIPT_EXTENSION;

  const isExists = await fse.exists(predictedPath);

  if (isExists) return predictedPath;

  return null;
}

async function resolvedAsDirectory(path: string) {
  return await glob("**/*.ts", {
    cwd: path,
    absolute: true,
    ignore: ["**/*.d.ts"],
  });
}

async function resolveTSFiles(sourcePath: string): Promise<string[]> {
  const validatedPath = await validateSourcePath(sourcePath);

  try {
    if (validatedPath && (await stat(validatedPath)).isFile()) {
      const accessible = await ensureAccessible(validatedPath);

      if (accessible) {
        Logger.info("Source:", validatedPath);
        return [validatedPath];
      }

      Logger.info("Could not access to the provided file path %s", path);
      process.exit(1);
    }
  } catch (error) {
    Logger.error("The provided source path does not exists.");
    process.exit(1);
  }

  try {
    if ((await stat(sourcePath)).isDirectory()) {
      Logger.info("Source:", sourcePath);
      return await resolvedAsDirectory(sourcePath);
    }
  } catch (error) {
    Logger.error("The provided source path does not exists.");
    process.exit(1);
  }

  Logger.error("The provided source path does not exists.");
  process.exit(1);
}

async function defineConfig(options: ConfigOptions) {
  const sourcePath = path.resolve(options.sourcePath);

  const files = await resolveTSFiles(sourcePath);

  if (files.length === 0) {
    Logger.error("No Typescript files found in %s", sourcePath);
    process.exit(1);
  }

  const serverOptions: Required<ServerOptions> = {
    pathPrefix: options.server?.pathPrefix || Constants.PREFIX,
    port: options.server?.port || Constants.PORT,
  };

  const fakerOptions: Required<FakerEngineOptions> = {
    locale: options.faker?.locale || Constants.locale(),
  };

  return { files, serverOptions, fakerOptions };
}

async function getConfig(): Promise<UserConfig> {
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

    return config.mod.default as UserConfig;
  } catch (error) {
    Logger.error("Could not load the config file.");
    process.exit(1);
  }
}

async function ensureAccessible(path: string) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export type { UserConfig };
export { defineConfig, getConfig };
