export const RUNTIME_SOURCE = `const _fakelab = {};
_fakelab.url = () => "http://localhost:PORT/PREFIX/";

function _count(opts = {}) {
  if ("count" in opts && typeof opts["count"] === "number") return opts.count;

  return null;
}

_fakelab.enabled = () => FAKELAB_ENABLED;

_fakelab.fetch = async function (name, options) {
  const count = _count(options);
  const search = count !== null ? "?count=" + count : "";

  const res = await fetch(_fakelab.url() + name + search);

  if (!res.ok) throw new Error("[fakelab] Failed to retrieve mock data.");

  return res.json();
};

_fakelab.gen = function (name, options) {
  const count = _count(options);

  if(count === null) return functions[name]();

  return Array.from({length:count},() => functions[name]())
}

_fakelab.enabled = _fakelab.enabled.bind(_fakelab);
_fakelab.url = _fakelab.url.bind(_fakelab);
_fakelab.fetch = _fakelab.fetch.bind(_fakelab);
_fakelab.gen = _fakelab.gen.bind(_fakelab);

const fakelab = Object.freeze(_fakelab);


export {fakelab};
`;
