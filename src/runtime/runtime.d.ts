declare function fetch<T extends keyof Runtime$>(name: T): Promise<Runtime$[T]>;
declare function fetch<T extends keyof Runtime$>(name: T, options: Options): Promise<Runtime$[T][]>;

declare function generate<T extends keyof Runtime$>(name: T): Runtime$[T];
declare function generate<T extends keyof Runtime$>(name: T, options: Options): Runtime$[T][];

declare function currentLocale(): Locale$["__locale"];

declare function enabled(): boolean;
declare function headless(): boolean;
declare function url(): string;

declare const fakelab: {
  generate: typeof generate;
  fetch: typeof fetch;
  currentLocale: typeof currentLocale;
  enabled: typeof enabled;
  headless: typeof headless;
  url: typeof url;
};

type Options = { count: number };

interface Locale$ {}

interface Runtime$ {}

export { fakelab };
