import { defineConfig } from "./src/main";

export default defineConfig({
  sourcePath: ["./fixtures/**/*.ts"],
  server: { port: 50001, includeSnapshots: true },
  database: { enabled: true },
  snapshot: { enabled: true },
  graphQL: { enabled: true },
  cache: { enabled: true },
  faker: { locale: "en" },
  runtime: { switchable: true, headless: false },
});
