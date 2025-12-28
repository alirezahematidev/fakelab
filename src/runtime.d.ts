/* eslint-disable @typescript-eslint/no-unused-vars */
declare function fetch<T extends keyof Runtime$, C extends number | undefined = undefined>(name: T, count?: C): Promise<Result$<Runtime$[T], C>>;
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
type Result$<T, CT> = CT extends number ? (CT extends 0 ? T : T[]) : T;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Runtime$ {}

type Typeof<T extends keyof Runtime$> = ReturnType<typeof type$<T>>;

export type { Typeof };
export { fakelab, database };
