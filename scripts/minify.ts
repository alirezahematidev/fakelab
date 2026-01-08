import { transform } from "esbuild";
import fs from "fs-extra";
import path from "node:path";

const argv = process.argv;

async function minify() {
  let [, , name] = argv;

  if (!name.endsWith(".js")) name = name + ".js";

  const input = await fs.readFile(path.resolve(process.cwd(), "javascripts", name), "utf8");

  const output = await transform(input, { minify: true, platform: "browser", target: "es2020" });

  fs.writeFile(path.resolve(process.cwd(), "src/public/js", name.toLowerCase().replace(/\.js$/, ".min.js")), output.code);
}

minify().catch(console.error);
