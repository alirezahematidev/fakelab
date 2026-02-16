export const DATABASE_SOURCE = `const _database = {};
const url = "http://localhost:PORT/PREFIX/";

_database.enabled = () => ENABLED;

_database.currentLocale = () => "LOCALE";

_database.get = async function (name, predicate) {
  const response = await fetch(url + "database/" + name);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

  const result = await response.json();

  if (!Array.isArray(result)) throw new Error("[fakelab] Database table data must be an array.");

  if (typeof predicate === "function") return result.find(predicate) ?? null;

  return result;
};
_database.set = async function (name) {
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


_database.enabled = _database.enabled.bind(_database);
_database.get = _database.get.bind(_database);
_database.set = _database.set.bind(_database);
_database.seed = _database.seed.bind(_database);
_database.flush = _database.flush.bind(_database);
_database.currentLocale = _database.currentLocale.bind(_database);

const database = Object.freeze(_database);

export { database };
`;
