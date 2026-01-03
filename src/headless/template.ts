export const SOURCE = `import { faker } from "@faker-js/faker/locale/LOCALE";

function _count(opts = {}) {
  if ("count" in opts && typeof opts["count"] === "number") return opts.count;

  return null;
}

const functions = {
  FUNCTIONS
};

function generate(name, options) {
  const proxy = new Proxy(functions, {
    get(target, property) {
      const count = _count(options);

      if (count === null) return target[property]();

      return Array.from({ length: count }, () => target[property]());
    },
  });

  return proxy[name]
}

export { generate }
`;
