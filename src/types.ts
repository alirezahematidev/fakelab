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
  enabled: boolean;
  dest?: string;
};

type BrowserExposeOptions = {
  name: string;
  mode: "module" | "global";
};

export type BrowserOptions = {
  expose?: Partial<BrowserExposeOptions>;
};

type NetworkBehaviourOptions = {
  delay?: number | [number, number];
  errorRate?: number;
  timeoutRate?: number;
  offline?: boolean;
};

export type NetworkOptions = NetworkBehaviourOptions & {
  preset?: string;
  presets?: Record<string, NetworkBehaviourOptions>;
};

export type ConfigOptions = {
  sourcePath: string | string[];
  server?: ServerOptions;
  faker?: FakerEngineOptions;
  database?: DatabaseOptions;
  browser?: BrowserOptions;
  network?: NetworkOptions;
  transform?: Record<string, (data: any) => any | Promise<any>>;
};

export type UserConfig = {
  files: string[];
  serverOptions: Required<ServerOptions>;
  fakerOptions: Required<FakerEngineOptions>;
};

type BuilderResult = { data: unknown; json: string };

export type ForgeOptions = {
  count?: string;
};

export type Entity = {
  type: Type;
  filepath: string;
  tablepath: string;
  table: Low<unknown[]>;
};

export interface Builder {
  readonly entities: Map<string, Entity>;
  build: (type: Type, options: ForgeOptions) => Promise<BuilderResult>;
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
