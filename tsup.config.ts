import path from "node:path";
import { defineConfig } from "tsup";
import postbuild from "./scripts/postbuild";

export default defineConfig({
  entry: { main: path.resolve(__dirname, "src/main.ts"), cli: path.resolve(__dirname, "src/cli.ts") },
  dts: { entry: { main: path.resolve(__dirname, "src/main.ts") } },
  target: "es2022",
  clean: true,
  format: "esm",
  outDir: "lib",
  minify: true,
  treeshake: true,
  splitting: false,
  onSuccess: postbuild,
});
