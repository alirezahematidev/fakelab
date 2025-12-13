import type { ConfigOptions, UserConfig } from "../types";
import { Config } from "./conf";

function defineConfig(options: ConfigOptions): Config {
  return new Config(options);
}

export type { UserConfig };
export { defineConfig };
