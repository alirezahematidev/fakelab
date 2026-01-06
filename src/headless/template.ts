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


_fakelab.genSync = function (name, options) {
  const count = _count(options);

  if(count === null) return functions[name]();

  return Array.from({length:count},() => functions[name]())
}

_fakelab.gen = async function (name, options) {
  return _fakelab.genSync(name, options);
}

_fakelab.url = _fakelab.url.bind(_fakelab);
_fakelab.gen = _fakelab.gen.bind(_fakelab);
_fakelab.genSync = _fakelab.genSync.bind(_fakelab);

const fakelab = Object.freeze(_fakelab);


export {fakelab};
`;
