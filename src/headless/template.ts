export const HEADLESS_SOURCE = `import { faker } from "@faker-js/faker/locale/LOCALE";
const _fakelab = {};
_fakelab.url = () => "http://localhost:PORT/PREFIX/";

function _count(opts = {}) {
  if ("count" in opts && typeof opts["count"] === "number") return opts.count;

  return null;
}

const functions = {
  FUNCTIONS
};


_fakelab.enabled = () => FAKELAB_ENABLED;

_fakelab.gen = function (name, options) {
  const count = _count(options);

  if(count === null) return functions[name]();

  return Array.from({length:count},() => functions[name]())
}


_fakelab.fetch = async function (name, options) {
  console.warn("[fakelab] fetch() is disabled in headless mode.")

  return {}
};

_fakelab.enabled = _fakelab.enabled.bind(_fakelab);
_fakelab.url = _fakelab.url.bind(_fakelab);
_fakelab.gen = _fakelab.gen.bind(_fakelab);
_fakelab.fetch = _fakelab.fetch.bind(_fakelab);

const fakelab = Object.freeze(_fakelab);


export {fakelab};
`;

export const HEADLESS_DTS_SOURCE = `declare function gen<T extends keyof Runtime$>(name: T): Runtime$[T];
declare function gen<T extends keyof Runtime$>(name: T, options: Options): Runtime$[T][];

declare function fetch<T extends keyof Runtime$>(name: T, options?: Options): never;

declare function enabled(): boolean;
declare function url(): string;

declare const fakelab: {
  gen: typeof gen;
  fetch: typeof fetch;
  url: typeof url;
  enabled: typeof enabled;
};

type Options = { count: number };

interface Runtime$ {}

export { fakelab };
`;
