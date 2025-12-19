export const MODULE_SOURCE_TEMP = `let fl = {};
fl.url = () => "http://localhost:PORT/PREFIX/";
fl.fetch = async function (name, count) {
  const search = count ? "?count=" + count : "";

  const response = await fetch(fl.url() + name + search);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived mock data.");

  const result = await response.json();

  return result;
};
const NAME = Object.freeze(fl);
export { NAME };`;

export const MODULE_DECL_TEMP = `declare function fetch<T extends keyof Runtime$, CT extends number | undefined = undefined>(name: T, count?: CT): Promise<Result$<Runtime$[T], CT>>;
declare function url(): string;
declare const NAME: {
  fetch: typeof fetch;
  url: typeof url;
};
type Result$<T, CT> = CT extends number ? (CT extends 0 ? T : T[]) : T;
interface Runtime$ {}
export { NAME };`;

export const GLOBAL_SOURCE_TEMP = `global.NAME = {};
global.NAME.url = () => "http://localhost:PORT/PREFIX/";
global.NAME.fetch = async function (name, count) {
  const search = count ? "?count=" + count : "";

  const response = await fetch(global.NAME.url() + name + search);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived mock data.");

  const result = await response.json();

  return result;
};`;

export const GLOBAL_DECL_TEMP = `export {};

declare global {
  const NAME: {
    fetch<T extends keyof Runtime$, CT extends number | undefined = undefined>(name: T, count?: CT): Promise<Result$<Runtime$[T], CT>>;
    url(): string;
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
}
`;

// db: {get<Response>(name: keyof FakeRuntime): Promise<Response>;post(name: keyof FakeRuntime): Promise<void>;}

// global.fakelab.db.get = async function (name) {
//   const response = await fetch(global.fakelab.URL + "__db/" + name);

//   if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

//   const result = await response.json();

//   return result;
// };
// global.fakelab.db.post = async function (name) {
//   const response = await fetch(global.fakelab.URL + "__db/" + name, { method: "POST" });

//   if (!response.ok) throw new Error("[fakelab] Failed to post data to database.");
// };
