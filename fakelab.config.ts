import { defineConfig } from "./src/main";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: { port: 50001, includeSnapshots: true, openapi: true },
  database: { enabled: true },
  headless: false,
  graphQL: { enabled: true },
  cache: { enabled: true },
  faker: { locale: "fa" },
});
