declare function gen<T extends keyof Runtime$>(name: T): Promise<Runtime$[T]>;
declare function gen<T extends keyof Runtime$>(name: T, options: GenerateOptions): Promise<Runtime$[T][]>;
declare function genSync<T extends keyof Runtime$>(name: T): Runtime$[T];
declare function genSync<T extends keyof Runtime$>(name: T, options: GenerateOptions): Runtime$[T][];
declare function url(): string;
declare const fakelab: {
  gen: typeof gen;
  genSync: typeof genSync;
  url: typeof url;
};

type GenerateOptions = { count: number };

interface Runtime$ {}

export { fakelab };
