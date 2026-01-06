import fs from "fs/promises";
import path from "node:path";

async function copyCompat() {
  await Promise.all([
    fs.cp(path.resolve("src/compat/runtime.js"), path.resolve("runtime.js"), { force: true }),
    fs.cp(path.resolve("src/compat/runtime.d.ts"), path.resolve("runtime.d.ts"), { force: true }),
    fs.cp(path.resolve("src/compat/database.js"), path.resolve("database.js"), { force: true }),
    fs.cp(path.resolve("src/compat/database.d.ts"), path.resolve("database.d.ts"), { force: true }),
    fs.cp(path.resolve("src/compat/type-utils.d.ts"), path.resolve("type-utils.d.ts"), { force: true }),
  ]);
}

copyCompat().catch(console.error);
