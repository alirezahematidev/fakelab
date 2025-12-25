export const SOURCE = `let fl = {};
let db = {};
fl.url = () => "http://localhost:PORT/PREFIX/";
fl.fetch = async function (name, count) {
  const search = count ? "?count=" + count : "";

  const response = await fetch(fl.url() + name + search);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived mock data.");

  const result = await response.json();

  return result;
};

db.enabled = () => ENABLED;

db.type$ = function (_name) {};

db.get = async function (name, predicate) {
  const response = await fetch(fakelab.url() + "database/" + name);

  if (!response.ok) throw new Error("[fakelab] Failed to retreived data from database.");

  const result = await response.json();

  if (!Array.isArray(result)) throw new Error("[fakelab] Database table data must be an array.");

  if (typeof predicate === "function") return result.find(predicate) ?? null;

  return result;
};
db.post = async function (name) {
  const response = await fetch(fakelab.url() + "database/" + name, { method: "POST", headers: { "Content-Type": "application/json" } });

  if (!response.ok) throw new Error("[fakelab] Failed to post data to database.");
};
db.seed = async function (name, options) {
  const response = await fetch(fakelab.url() + "database/insert/" + name, { method: "POST", body: JSON.stringify(options), headers: { "Content-Type": "application/json" } });

  if (!response.ok) throw new Error("[fakelab] Failed to seed data to database.");
};
db.flush = async function (name) {
  const response = await fetch(fakelab.url() + "database/flush/" + name, { method: "POST" });

  if (!response.ok) throw new Error("[fakelab] Failed to flush seeded data from database.");
};

const fakelab = Object.freeze(fl);
const database = Object.freeze(db);

export { fakelab, database };
`;
