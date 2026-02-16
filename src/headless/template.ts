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

_fakelab.headless = () => HEADLESS;

_fakelab.currentLocale = () => "LOCALE";

_fakelab.generate = function (name, options) {
  const count = _count(options);

  if(count === null) return functions[name]();

  return Array.from({length:count},() => functions[name]())
}

_fakelab.fetch = async function (name, options) {
  if (SWITCHABLE) {
    return _fakelab.generate(name, options);
  }

  console.warn("[fakelab] fetch() is disabled in headless mode.")

  return {}
};

_fakelab.enabled = _fakelab.enabled.bind(_fakelab);
_fakelab.url = _fakelab.url.bind(_fakelab);
_fakelab.generate = _fakelab.generate.bind(_fakelab);
_fakelab.fetch = _fakelab.fetch.bind(_fakelab);
_fakelab.headless = _fakelab.headless.bind(_fakelab);
_fakelab.currentLocale = _fakelab.currentLocale.bind(_fakelab);

const fakelab = Object.freeze(_fakelab);


export {fakelab};
`;

export const HEADLESS_DTS_SOURCE = `declare function generate<T extends keyof Runtime$>(name: T): Runtime$[T];
declare function generate<T extends keyof Runtime$>(name: T, options: Options): Runtime$[T][];

declare function fetch<T extends keyof Runtime$, S extends SWITCHABLE>(name: T): S extends true ? Promise<Runtime$[T]> : never;
declare function fetch<T extends keyof Runtime$, S extends SWITCHABLE>(name: T, options: Options): S extends true ? Promise<Runtime$[T][]> : never;

declare function currentLocale(): Locale$["__locale"];

declare function enabled(): boolean;
declare function headless(): boolean;
declare function url(): string;

declare const fakelab: {
  generate: typeof generate;
  fetch: typeof fetch;
  currentLocale: typeof currentLocale;
  url: typeof url;
  enabled: typeof enabled;
  headless: typeof headless;
};

type Options = { count: number };

interface Runtime$ {}

interface Locale$ {}

export { fakelab };
`;
