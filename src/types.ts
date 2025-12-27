import type { Type } from "ts-morph";
import type { FakerLocale } from "./constants";
import type { Low } from "lowdb";

export type EvaluatedFakerArgs = { path: string; args: any } | undefined;
export type LazyFaker = typeof import("@faker-js/faker").faker;

export type ServerOptions = {
  /**
   * Port number that the mock server will listen on.
   * @default 5200
   */
  port?: number;
  /**
   * URL path prefix used for all generated endpoints.
   * @default `api`
   */
  pathPrefix?: string;

  /**
   * Includes the snapshot typescript sources if exists.
   * @default true
   */
  includeSnapshots?: boolean;
};

export type FakerEngineOptions = {
  /**
   * Locale used by the faker engine when generating mock data.
   * Controls language-specific values such as names, addresses, etc.
   * @example "fa"
   */
  locale?: FakerLocale;
};

export type DatabaseOptions = {
  /**
   * Enables persistent storage for mock data.
   * When enabled, `POST` mutation will be stored.
   */
  enabled: boolean;
};

type NetworkErrorOptions = {
  /**
   * HTTP error status codes to simulate.
   *
   * @example [400, 404, 500]
   */
  statusCodes?: ErrorStatusCode[];
  /**
   * Custom messages per status code.
   *
   * @example { 404: "Not found", 500: "Server error" }
   */
  messages?: Record<ErrorStatusCode, string>;
};

type NetworkBehaviourOptions = {
  /**
   * Artificial response delay in milliseconds.
   * Can be a fixed number or a range `[min, max]`.
   * @example 300 or [200, 800]
   */
  delay?: number | [number, number];
  /**
   * Probability (0–1) that a request will fail with an error response.
   * @example `0.1` → 10% error rate
   */
  errorRate?: number;
  /**
   * Probability (0–1) that a request will timeout.
   * @example `0.05` → 5% timeout rate
   */
  timeoutRate?: number;
  /**
   * When enabled, all requests will behave as if the network is offline.
   */
  offline?: boolean;

  errors?: NetworkErrorOptions;
};

export type NetworkOptions = NetworkBehaviourOptions & {
  /**
   * Name of the active network preset.
   */
  preset?: string;
  /**
   * Collection of predefined network behavior presets.
   * Each preset can simulate different network conditions.
   */
  presets?: Record<string, NetworkBehaviourOptions>;
};

type SourceHeaders = NonNullable<Parameters<typeof fetch>[1]>["headers"];

export type SnapshotDataSource = {
  /**
   * http url
   * @example "https://api.example.com/users"
   */
  url: string;
  /**
   * Snapshot name used for generated interface.
   * @example "User"
   */
  name: string;
  /**
   * Optional HTTP headers sent with the snapshot fetch request.
   * @example { Authorization: "Bearer <token>" }
   */
  headers?: SourceHeaders;
};

export type SnapshotOptions = {
  /**
   * Enables snapshot.
   */
  enabled: boolean;
  /**
   * Predefined snapshot sources
   */
  sources?: SnapshotDataSource[];
};

export type ConfigOptions = {
  /**
   * Path or paths to the source files that define the typescript types.
   */
  sourcePath: string | string[];
  /**
   * Server-related configuration.
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/server-command|Server Documentation}
   */
  server?: ServerOptions;
  /**
   * Faker engine configuration for data generation.
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/faker-annotations|Faker Documentation}
   */
  faker?: FakerEngineOptions;
  /**
   * Database persistence configuration.
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/database-mode|Database Documentation}
   */
  database?: DatabaseOptions;
  /**
   * Network simulation configuration.
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/network-simulation|Network Documentation}
   */
  network?: NetworkOptions;
  /**
   * Snapshot configuration.
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/snapshot|Snapshot Documentation}
   */
  snapshot?: SnapshotOptions;
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
  snapshot: boolean;
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
  freshSnapshots?: boolean;
};

export type SnapshotCLIOptions = {
  source?: string;
  refresh?: string;
  delete?: string;
};

export type SnapshotPrepareOptions = {
  freshSnapshots?: boolean;
};

export type SnapshotSchema = {
  sources: Array<{ url: string; name: string; headers?: SnapshotDataSource["headers"] }>;
};

export type SnapshotUpdateArgs =
  | {
      url: string;
      delete: true;
    }
  | {
      url: string;
      name?: string;
      delete?: false;
      headers?: SnapshotDataSource["headers"];
    };

export type Booleanish = "true" | "false";

type ErrorStatusCode =
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429
  | 431
  | 451
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 510
  | 511;
