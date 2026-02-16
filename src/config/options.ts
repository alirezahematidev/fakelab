import { FAKER_LOCALES, type FakerLocale } from "../constants";
import type {
  CacheOptions,
  ConfigOptions,
  DatabaseOptions,
  FakerEngineOptions,
  GraphQLOptions,
  NetworkOptions,
  RuntimeOptions,
  ServerOptions,
  SnapshotOptions,
  WebhookOptions,
} from "../types";

const RUNTIME = Symbol("ConfigOptHandler.runtime");
const CACHE = Symbol("ConfigOptHandler.cache");
const SERVER = Symbol("ConfigOptHandler.server");
const DATABASE = Symbol("ConfigOptHandler.database");
const NETWORK = Symbol("ConfigOptHandler.network");
const SNAPSHOT = Symbol("ConfigOptHandler.snapshot");
const GRAPHQL = Symbol("ConfigOptHandler.graphQL");
const FAKER = Symbol("ConfigOptHandler.faker");
const WEBHOOK = Symbol("ConfigOptHandler.webhook");

export class ConfigOptHandler {
  private readonly DEFAULT_PREFIX = "api";
  private readonly DEFAULT_PORT = 5200;

  protected readonly DEFAULT_TS_CONFIG_FILE = "tsconfig.json";

  protected NETWORK_DEFAULT_OPTIONS: Readonly<NetworkOptions>;

  constructor(protected readonly opts: ConfigOptions) {
    this[SERVER] = this[SERVER].bind(this);
    this[DATABASE] = this[DATABASE].bind(this);
    this[NETWORK] = this[NETWORK].bind(this);
    this[SNAPSHOT] = this[SNAPSHOT].bind(this);
    this[FAKER] = this[FAKER].bind(this);
    this[WEBHOOK] = this[WEBHOOK].bind(this);
    this[GRAPHQL] = this[GRAPHQL].bind(this);
    this[CACHE] = this[CACHE].bind(this);
    this[RUNTIME] = this[RUNTIME].bind(this);

    this.NETWORK_DEFAULT_OPTIONS = Object.freeze({
      delay: this.opts.network?.delay || 0,
      errorRate: this.opts.network?.errorRate || 0,
      timeoutRate: this.opts.network?.timeoutRate || 0,
      offline: this.opts.network?.offline ?? false,
    });
  }

  public get options() {
    return {
      server: this[SERVER],
      database: this[DATABASE],
      network: this[NETWORK],
      snapshot: this[SNAPSHOT],
      faker: this[FAKER],
      webhook: this[WEBHOOK],
      graphQL: this[GRAPHQL],
      cache: this[CACHE],
      runtime: this[RUNTIME],
    };
  }

  [RUNTIME](): Required<RuntimeOptions> {
    return {
      headless: this.opts.runtime?.headless ?? false,
      switchable: this.opts.runtime?.switchable ?? true,
    };
  }

  [CACHE](): Required<CacheOptions> {
    return {
      enabled: this.opts.cache?.enabled ?? true,
      ttl: this.opts.cache?.ttl || Number.MAX_SAFE_INTEGER,
    };
  }

  private [SERVER](prefix?: string, port?: number): Required<ServerOptions> {
    return {
      pathPrefix: prefix || this.opts.server?.pathPrefix || this.DEFAULT_PREFIX,
      port: port || this.opts.server?.port || this.DEFAULT_PORT,
      includeSnapshots: this.opts.server?.includeSnapshots ?? true,
    };
  }

  private [DATABASE](): Required<DatabaseOptions> {
    return {
      enabled: this.opts.database?.enabled ?? false,
    };
  }

  private [NETWORK](): NetworkOptions {
    const preset = this.opts.network?.preset;
    const presets = this.opts.network?.presets ?? {};

    if (!preset || !presets[preset]) return this.NETWORK_DEFAULT_OPTIONS;

    return {
      ...presets[preset],
      ...(this.opts.network ?? {}),
    };
  }

  private [SNAPSHOT](): Required<SnapshotOptions> {
    return {
      enabled: this.opts.snapshot?.enabled ?? false,
      sources: this.opts.snapshot?.sources || [],
    };
  }

  private [GRAPHQL](): Required<GraphQLOptions> {
    return {
      enabled: this.opts.graphQL?.enabled ?? false,
    };
  }

  private [FAKER](locale?: FakerLocale): Required<FakerEngineOptions> {
    const lang = locale || this.opts.faker?.locale;

    if (lang && FAKER_LOCALES.includes(lang)) {
      return { locale: lang };
    }
    return { locale: this.DEFAULT_FAKER_LOCALE };
  }

  private [WEBHOOK](): Required<WebhookOptions> {
    return {
      enabled: this.opts.webhook?.enabled ?? false,
      hooks: this.opts.webhook?.hooks ?? [],
    };
  }

  private get DEFAULT_FAKER_LOCALE(): FakerLocale {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;

    if (!locale) return "en";

    const [lang] = locale.split("-") as [FakerLocale];

    if (!FAKER_LOCALES.includes(lang)) return "en";

    return lang;
  }
}
