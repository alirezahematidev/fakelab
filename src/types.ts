import type { Type } from "ts-morph";
import type { FakerLocale } from "./constants";
import type { Low } from "lowdb";
import type { TriggerEvent } from "./events/types";

export type EvaluatedFakerArgs = { path: string; args: unknown } | undefined;
export type LazyFaker = typeof import("@faker-js/faker").faker;

export type HttpHeaders = NonNullable<Parameters<typeof fetch>[1]>["headers"];

export type LoadConfigOptions = {
  readonly _filepath: string | null;
};

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
   * Includes snapshot sources if exists.
   * @default true
   */
  includeSnapshots?: boolean;
};

export type FakerEngineOptions = {
  /**
   * Locale used by the faker engine when generating mock data.
   * Controls language-specific values such as names, addresses, etc.
   * @example "en"
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
  messages?: Record<number, string>;
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

export type SnapshotDataSource = {
  /**
   * Target http or https URL
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
  headers?: HttpHeaders;
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

export type Unsub = (reason?: string) => void;

export type HookValidationResult =
  | {
      message: string;
      error: true;
      args?: string[];
    }
  | {
      message: null;
      error: false;
      args?: string[];
    };

export type Hook = {
  /**
   * Unique name of the webhook hook.
   * Used for runtime, logging, and debugging purposes.
   *
   * @example "snapshot-captured"
   */
  name: string;
  /**
   * The event name that will trigger the webhook.
   */
  trigger: { event: TriggerEvent };
  /**
   * HTTP method used to send the webhook request.
   *
   * @remarks
   * Only `POST` is supported.
   */
  method: "POST";
  /**
   * Target http URL where the webhook payload will be sent.
   *
   * @remarks
   * Must be a valid http or https URL.
   *
   * @example "https://hooks.example.com/services/AAA"
   */
  url: string;
  /**
   * Optional HTTP headers to include in the webhook request.
   */
  headers?: HttpHeaders;
  /**
   * Optional payload transformer.
   * If not provided, the original event data is sent as-is.
   */
  transform?: (data: unknown) => unknown;
};

export type WebhookOptions = {
  /**
   * Enables webhook.
   */
  enabled: boolean;
  /**
   * List of configured webhook hooks.
   */
  hooks: Hook[];
};

export type GraphQLOptions = {
  /**
   * Enables graphQL.
   */
  enabled: boolean;
};

export type CacheOptions = {
  /**
   * Enables the file-based cache.
   *
   * @default true
   */
  enabled: boolean;
  /**
   * Time-to-live (TTL) for cache entries in milliseconds.
   *
   * When set, cached files older than this value are considered expired
   * and will be ignored or regenerated on the next request.
   *
   * @default 15 * 60 * 1000 // 15 minutes
   */
  ttl?: number;
};

export type ConfigOptions = {
  /**
   * Path or paths to the source files that define the typescript types.
   */
  sourcePath: string | string[];
  /**
   * Enables or disables Fakelab.
   *
   * When set to `false`, Fakelab will not initialize or start any services,
   * regardless of other configuration options.
   *
   * This is useful for conditionally enabling Fakelab based on the current
   * runtime environment (for example, `process.env.NODE_ENV === "development"`).
   *
   * @default true
   */
  enabled?: boolean;
  /**
   * Enables headless mode.
   *
   * When enabled, Fakelab runs without starting the HTTP server and only
   * performs non-interactive tasks such as generating snapshots, mocks,
   * or database files.
   *
   * This is useful for CI pipelines, build-time generation, or offline usage.
   *
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/headless|Headless Documentation}
   */
  headless?: boolean;

  /**
   * Path to a custom typescript config file.
   *
   * If not specified, Fakelab attempts to resolve the nearest `tsconfig.json`
   * automatically.
   */
  tsConfigFilePath?: string;

  /**
   * Cache configuration.
   *
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/cache|Cache Documentation}
   */
  cache?: CacheOptions;

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
   *
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/snapshot|Snapshot Documentation}
   */
  snapshot?: SnapshotOptions;

  /**
   * Webhook configuration.
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/webhook|Webhook Documentation}
   */
  webhook?: WebhookOptions;

  /**
   * GraphQL configuration.
   * @see {@link https://alirezahematidev.github.io/fakelab/docs/guides/graphQL|GraphQL Documentation}
   */
  graphQL?: GraphQLOptions;
};

export type UserConfig = {
  files: string[];
  serverOptions: Required<ServerOptions>;
  fakerOptions: Required<FakerEngineOptions>;
};

type BuilderResult = { data: unknown; json: string; fromCache: boolean };

export type ForgeOptions = {
  count?: string | number;
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
  build: (name: string, type: Type, options: ForgeOptions) => Promise<BuilderResult>;
}

export type ServerCLIOptions = {
  source?: string;
  pathPrefix?: string;
  port?: number;
  locale?: string;
  freshSnapshots?: boolean;
  tsConfigPath?: string;
  headless?: boolean;
};

export type SnapshotCLIOptions = {
  name?: string;
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
