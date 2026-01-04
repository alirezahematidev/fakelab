export const HEADLESS_SOURCE = `import { faker } from "@faker-js/faker/locale/LOCALE";
function _count(opts = {}) {
  if ("count" in opts && typeof opts["count"] === "number") return opts.count;

  return null;
}

const functions = {
  FUNCTIONS
};

function generate(name, options) {
  const count = _count(options);

  if(count === null) return functions[name]();

  return Array.from({length:count},() => functions[name]())
}

export {generate};
`;
