export const MODULE_SOURCE_TEMP = `let fl = {};
let db = {};
fl.url = () => "http://localhost:PORT/PREFIX/";
fl.fetch = async function (name, count) {
  const search = count ? "?count=" + count : "";

  const response = await fetch(fl.url() + name + search);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived mock data.");

  const result = await response.json();

  return result;
};

db.enabled = () => ENABLED_COND;

db.get = async function (name, predicate) {
  const response = await fetch(NAME.url() + "database/" + name);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

  const result = await response.json();

  if(!Array.isArray(result)) throw new Error("[fakelab] Database table data must be an array.");

  if (typeof predicate === 'function') return result.find(predicate) ?? null;

  return result;
};
db.post = async function (name) {
  const response = await fetch(NAME.url() + "database/" + name, { method: "POST", headers: {"Content-Type": "application/json" } });

  if (!response.ok) throw new Error("[fakelab] Failed to post data to database.");
};
db.seed = async function (name, options) {
  const response = await fetch(NAME.url() + "database/insert/" + name, { method: "POST", body: JSON.stringify(options), headers: {"Content-Type": "application/json" } });

  if (!response.ok) throw new Error("[fakelab] Failed to seed data to database.");
};
db.flush = async function (name) {
  const response = await fetch(NAME.url() + "database/flush/" + name, { method: "POST" });

  if (!response.ok) throw new Error("[fakelab] Failed to flush seeded data from database.");
};

const NAME = Object.freeze(fl);
const database = Object.freeze(db);

export { NAME, database };`;

export const MODULE_DECL_TEMP = `declare function fetch<T extends keyof Runtime$, C extends number | undefined = undefined>(name: T, count?: C): Promise<Result$<Runtime$[T], C>>;
declare function get<T extends keyof Runtime$>(name: T): Promise<Array<Runtime$[T]>>;
declare function get<T extends keyof Runtime$>(name: T, predicate: (value: Runtime$[T]) => boolean): Promise<Runtime$[T] | null>;
declare function post<T extends keyof Runtime$>(name: T): Promise<void>;
declare function seed<T extends keyof Runtime$>(name: T, options?: SeedOptions): Promise<void>;
declare function flush<T extends keyof Runtime$>(name: T): Promise<void>;
declare function enabled(): boolean;
declare function url(): string;
declare const NAME: {
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
   * - \`"reset"\`: Removes all existing data and recreates it from scratch.
   * - \`"once"\`: Seeds data only if the database is empty.
   * - \`"merge"\`: Inserts new records and updates existing ones. The total number of items per table
   *   is limited to \`1000\` records.
   * @default "reset"
   */
  strategy?: "reset" | "once" | "merge"
}
type Result$<T, CT> = CT extends number ? (CT extends 0 ? T : T[]) : T;
interface Runtime$ {}

export { NAME, database };`;

export const GLOBAL_SOURCE_TEMP = `global.NAME = {};
global.NAME.database = {};
global.NAME.url = () => "http://localhost:PORT/PREFIX/";
global.NAME.fetch = async function (name, count) {
  const search = count ? "?count=" + count : "";

  const response = await fetch(global.NAME.url() + name + search);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived mock data.");

  const result = await response.json();

  return result;
};
global.NAME.database.enabled = () => ENABLED_COND;
global.NAME.database.get = async function (name, predicate) {
  const response = await fetch(global.NAME.url() + "database/" + name);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

  const result = await response.json();

  if(!Array.isArray(result)) throw new Error("[fakelab] Database table data must be an array.");

  if (typeof predicate === 'function') return result.find(predicate) ?? null;

  return result;
};
global.NAME.database.post = async function (name) {
  const response = await fetch(global.NAME.url() + "database/" + name, { method: "POST", headers: {"Content-Type": "application/json" } });

  if (!response.ok) throw new Error("[fakelab] Failed to post data to database.");
};
global.NAME.database.seed = async function (name, options) {
  const response = await fetch(global.NAME.url() + "database/insert/" + name, { method: "POST", body: JSON.stringify(options), headers: {"Content-Type": "application/json" } });

  if (!response.ok) throw new Error("[fakelab] Failed to seed data to database.");
};
global.NAME.database.flush = async function (name) {
  const response = await fetch(global.NAME.url() + "database/flush/" + name, { method: "POST" });

  if (!response.ok) throw new Error("[fakelab] Failed to flush seeded data from database.");
};

const NAME = Object.freeze(fl);
const database = Object.freeze(db);

export { NAME, database };`;

export const GLOBAL_DECL_TEMP = `export {};

declare global {
  const database: {
    get<T extends keyof Runtime$>(name: T): Promise<Array<Runtime$[T]>>;
    get<T extends keyof Runtime$>(name: T, predicate: (value: Runtime$[T]) => boolean): Promise<Runtime$[T] | null>;
    post(name: keyof Runtime$): Promise<void>;
    seed(name: keyof Runtime$, options?: SeedOptions): Promise<void>;
    flush(name: keyof Runtime$): Promise<void>;
    enabled(): boolean;
  };
  const NAME: {
    fetch<T extends keyof Runtime$, C extends number | undefined = undefined>(name: T, count?: C): Promise<Result$<Runtime$[T], C>>;
    url(): string;
    database: typeof database;
  };
  type SeedOptions = {
    /**
     * Number of records to generate.
     */
    count?: number;
    /**
     * Defines how seeding interacts with existing database data.
     * - \`"reset"\`: Removes all existing data and recreates it from scratch.
     * - \`"once"\`: Seeds data only if the database is empty.
     * - \`"merge"\`: Inserts new records and updates existing ones. The total number of items per table
     *   is limited to \`1000\` records.
     * @default "reset"
     */
    strategy?: "reset" | "once" | "merge"
  }
  type Result$<T, CT> = CT extends number ? (CT extends 0 ? T : T[]) : T;
  interface Runtime$ {}
  interface Window {
    readonly NAME: typeof NAME;
  }

  namespace NodeJS {
    interface Global {
      NAME: typeof NAME;
    }
  }
}`;
