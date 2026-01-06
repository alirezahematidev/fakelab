declare function fetch<T extends keyof Runtime$>(name: T): Promise<Runtime$[T]>;
declare function fetch<T extends keyof Runtime$>(name: T, options: Options): Promise<Runtime$[T][]>;

declare function gen<T extends keyof Runtime$>(name: T): Runtime$[T];
declare function gen<T extends keyof Runtime$>(name: T, options: Options): Runtime$[T][];

declare function enabled(): boolean;
declare function url(): string;

declare const fakelab: {
  gen: typeof gen;
  fetch: typeof fetch;
  enabled: typeof enabled;
  url: typeof url;
};

type Options = { count: number };

interface Runtime$ {}

export { fakelab };
