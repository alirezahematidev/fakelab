/* eslint-disable @typescript-eslint/no-unused-vars */

// Auto-generated runtime data type declarations

declare function fetch<T extends keyof Runtime$>(name: T): Promise<Runtime$[T]>;
declare function fetch<T extends keyof Runtime$>(name: T, options: FetchOptions): Promise<Runtime$[T][]>;
declare function type$<T extends keyof Runtime$>(): Runtime$[T];
declare function get<T extends keyof Runtime$>(name: T): Promise<Array<Runtime$[T]>>;
declare function get<T extends keyof Runtime$>(name: T, predicate: (value: Runtime$[T]) => boolean): Promise<Runtime$[T] | null>;
declare function post<T extends keyof Runtime$>(name: T): Promise<void>;
declare function seed<T extends keyof Runtime$>(name: T, options?: SeedOptions): Promise<void>;
declare function flush<T extends keyof Runtime$>(name: T): Promise<void>;
declare function enabled(): boolean;
declare function url(): string;
declare const fakelab: {
  fetch: typeof fetch;
  url: typeof url;
};
declare const database: {
  get: typeof get;
  post: typeof post;
  seed: typeof seed;
  flush: typeof flush;
  enabled: typeof enabled;
};

type FetchOptions = { count: number };
type SeedOptions = {
  /**
   * Number of records to generate.
   */
  count?: number;
  /**
   * Defines how seeding interacts with existing database data.
   * - `"reset"`: Removes all existing data and recreates it from scratch.
   * - `"once"`: Seeds data only if the database is empty.
   * - `"merge"`: Inserts new records and updates existing ones. The total number of items per table
   *   is limited to `1000` records.
   * @default "reset"
   */
  strategy?: "reset" | "once" | "merge";
};
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Runtime$ {}

type Typeof<T extends keyof Runtime$> = ReturnType<typeof type$<T>>;
type Keyof<T extends keyof Runtime$> = keyof Typeof<T>;

export type { Typeof, Keyof };
export { fakelab, database };
