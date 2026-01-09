import type { ConfigOptions } from "../types";
import { Config } from "./config";

function defineConfig(options: ConfigOptions): Config {
  return new Config(options);
}

export type { ConfigOptions };
export { defineConfig };
