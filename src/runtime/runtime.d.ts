/* eslint-disable @typescript-eslint/no-unused-vars */

// Auto-generated runtime data type declarations

declare function fetch<T extends keyof Runtime$>(name: T): Promise<Runtime$[T]>;
declare function fetch<T extends keyof Runtime$>(name: T, options: FetchOptions): Promise<Runtime$[T][]>;
declare function url(): string;
declare const fakelab: {
  fetch: typeof fetch;
  url: typeof url;
};

type FetchOptions = { count: number };

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Runtime$ {}

export { fakelab };
