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
db.get = async function (name) {
  if (!db.enabled()) throw new Error("[fakelab] Database is not enabled.");

  const response = await fetch(NAME.url() + "database/" + name);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

  const result = await response.json();

  return result;
};
db.post = async function (name) {
  if (!db.enabled()) throw new Error("[fakelab] Database is not enabled.");

  const response = await fetch(NAME.url() + "database/" + name, { method: "POST" });

  if (!response.ok) throw new Error("[fakelab] Failed to post data to database.");
};

const NAME = Object.freeze(fl);
const database = Object.freeze(db);

export { NAME, database };`;

export const MODULE_DECL_TEMP = `declare function fetch<T extends keyof Runtime$, CT extends number | undefined = undefined>(name: T, count?: CT): Promise<Result$<Runtime$[T], CT>>;
declare function get<T extends keyof Runtime$>(name: T): Promise<Runtime$[T]>;
declare function post<T extends keyof Runtime$>(name: T): Promise<void>;
declare function enabled(): boolean;
declare function url(): string;
declare const NAME: {
  fetch: typeof fetch;
  url: typeof url;
};
declare const database: {
  get: typeof get;
  post: typeof post;
  enabled: typeof enabled;
};
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
global.NAME.database.get = async function (name) {
  if (!global.NAME.database.enabled()) throw new Error("[fakelab] Database is not enabled.");

  const response = await fetch(global.NAME.url() + "database/" + name);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

  const result = await response.json();

  return result;
};
global.NAME.database.post = async function (name) {
  if (!global.NAME.database.enabled()) throw new Error("[fakelab] Database is not enabled.");

  const response = await fetch(global.NAME.url() + "database/" + name, { method: "POST" });

  if (!response.ok) throw new Error("[fakelab] Failed to post data to database.");
};

const NAME = Object.freeze(fl);
const database = Object.freeze(db);

export { NAME, database };`;

export const GLOBAL_DECL_TEMP = `export {};

declare global {
  const database: {
    enabled(): boolean;
    get<T extends keyof Runtime$>(name: T): Promise<Runtime$[T]>;
    post(name: keyof Runtime$): Promise<void>;
  };
  const NAME: {
    fetch<T extends keyof Runtime$, CT extends number | undefined = undefined>(name: T, count?: CT): Promise<Result$<Runtime$[T], CT>>;
    url(): string;
    database: typeof database;
  };
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
