import { defineConfig } from "./src/main";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: { port: 50001, includeSnapshots: true },
  database: { enabled: true },
  headless: false,
});
