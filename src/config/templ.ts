export class RuntimeTemplate {
  static source(port: number, prefix: string) {
    return `global.fakelab = {};
global.fakelab.db = {};
global.fakelab.URL = "http://localhost:${port}/${prefix}/";
global.fakelab.fetch = async function (name, count) {
  const search = count ? "?count=" + count : "";

  const response = await fetch(global.fakelab.URL + name + search);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived mock data.");

  const result = await response.json();

  return result;
};
global.fakelab.db.get = async function (name) {
  const response = await fetch(global.fakelab.URL + "__db/" + name);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

  const result = await response.json();

  return result;
};
global.fakelab.db.post = async function (name) {
  const response = await fetch(global.fakelab.URL + "__db/" + name, { method: "POST" });

  if (!response.ok) throw new Error("[fakelab] Failed to post data to database.");
};`;
  }

  static decl() {
    return `export {};

declare global {
  const fakelab: {
    fetch<T extends keyof FakeRuntime, Count extends number | undefined = undefined>(name: T, count?: Count): Promise<FakeResult<FakeRuntime[T], Count>>;
    db: {get<Response>(name: keyof FakeRuntime): Promise<Response>;post(name: keyof FakeRuntime): Promise<void>;}
    readonly URL: string;
  };
  type FakeResult<T, Count> = Count extends number ? (Count extends 0 ? T : T[]) : T;
  interface FakeRuntime {}
  interface Window {
    readonly fakelab: typeof fakelab;
  }

  namespace NodeJS {
    interface Global {
      fakelab: typeof fakelab;
    }
  }
}
`;
  }
}
