export const RUNTIME_SOURCE = `const _fakelab = {};
_fakelab.url = () => "http://localhost:PORT/PREFIX/";

function _count(opts = {}) {
  if ("count" in opts && typeof opts["count"] === "number") return opts.count;

  return null;
}

_fakelab.gen = async function (name, options) {
  const count = _count(options);
  const search = count !== null ? "?count=" + count : "";

  const res = await fetch(_fakelab.url() + name + search);

  if (!res.ok) throw new Error("[fakelab] Failed to retrieve mock data.");

  return res.json();
};

_fakelab.genSync = function (_name, _options) {
  console.warn("[fakelab] genSync() is only available in headless mode.");
  return {};
};

_fakelab.url = _fakelab.url.bind(_fakelab);
_fakelab.gen = _fakelab.gen.bind(_fakelab);
_fakelab.genSync = _fakelab.genSync.bind(_fakelab);

const fakelab = Object.freeze(_fakelab);


export {fakelab};
`;
