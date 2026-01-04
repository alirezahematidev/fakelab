export const RUNTIME_SOURCE = `const _fakelab = {};
_fakelab.url = () => "http://localhost:PORT/PREFIX/";

function _count(opts = {}) {
  if ("count" in opts && typeof opts["count"] === "number") return opts.count;

  return null;
}

_fakelab.fetch = async function (name, options) {
  const count = _count(options);

  const search = count !== null ? "?count=" + count : "";

  const response = await fetch(_fakelab.url() + name + search);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived mock data.");

  const result = await response.json();

  return result;
};

const fakelab = Object.freeze(_fakelab);

fakelab.url.bind(fakelab);
fakelab.fetch.bind(fakelab);

export {fakelab};
`;
