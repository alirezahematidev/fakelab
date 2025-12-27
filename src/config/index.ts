import type { ConfigOptions } from "../types";
import { Config } from "./conf";

function defineConfig(options: ConfigOptions): Config {
  return new Config(options);
}

export type { ConfigOptions };
export { defineConfig };
