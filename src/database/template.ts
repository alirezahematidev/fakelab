export const DATABASE_SOURCE = `const _database = {};
const url = "http://localhost:PORT/PREFIX/";

_database.enabled = () => ENABLED;

_database.get = async function (name, predicate) {
  const response = await fetch(url + "database/" + name);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

  const result = await response.json();

  if (!Array.isArray(result)) throw new Error("[fakelab] Database table data must be an array.");

  if (typeof predicate === "function") return result.find(predicate) ?? null;

  return result;
};
_database.post = async function (name) {
  const response = await fetch(url + "database/" + name, { method: "POST", headers: { "Content-Type": "application/json" } });

  if (!response.ok) throw new Error("[fakelab] Failed to post data to database.");
};
_database.seed = async function (name, options) {
  const response = await fetch(url + "database/insert/" + name, { method: "POST", body: JSON.stringify(options), headers: { "Content-Type": "application/json" } });

  if (!response.ok) throw new Error("[fakelab] Failed to seed data to database.");
};
_database.flush = async function (name) {
  const response = await fetch(url + "database/flush/" + name, { method: "POST" });

  if (!response.ok) throw new Error("[fakelab] Failed to flush seeded data from database.");
};

const database = Object.freeze(_database);

database.enabled.bind(database);
database.get.bind(database);
database.post.bind(database);
database.seed.bind(database);
database.flush.bind(database);

export { database };
`;
