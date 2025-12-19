import type { Type } from "ts-morph";
import type { FakerLocale } from "./constants";
import type { Low } from "lowdb";

export type EvaluatedFakerArgs = { path: string; args: any } | undefined;
export type LazyFaker = typeof import("@faker-js/faker").faker;

export type ServerOptions = {
  /**
   * @default 5200
   */
  port?: number;
  /**
   * @default `api`
   */
  pathPrefix?: string;
};

export type FakerEngineOptions = {
  locale?: FakerLocale;
};

export type DatabaseOptions = {
  enabled?: boolean;
  dest?: string;
};

type BrowserExposeOptions = {
  name: string;
  mode: "module" | "global";
};

export type BrowserOptions = {
  expose?: Partial<BrowserExposeOptions>;
};

export type ConfigOptions = {
  sourcePath: string | string[];
  server?: ServerOptions;
  faker?: FakerEngineOptions;
  database?: DatabaseOptions;
  browser?: BrowserOptions;
};

export type UserConfig = {
  files: string[];
  serverOptions: Required<ServerOptions>;
  fakerOptions: Required<FakerEngineOptions>;
};

type GeneratorForge = { data: unknown; json: string };

export type ForgeOptions = {
  count?: string;
};

export interface IGenerated {
  readonly entities: Map<string, { type: Type; filepath: string; table: Low<unknown[]> }>;
  forge: (type: Type, options: ForgeOptions) => Promise<GeneratorForge>;
}

export type ServerCLIOptions = {
  source?: string;
  pathPrefix?: string;
  port?: number;
  locale?: string;
};

export type Booleanish = "true" | "false";

export interface MockOptions {
  locale?: string;
}
