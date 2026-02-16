import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: { port: 50001 },
  cache: { enabled: false },
  faker: { locale: "fa" },
});
