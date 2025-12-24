import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: { port: 50001 },
  snapshot: { enabled: true },
  database: { enabled: true },
  network: { delay: [500, 1500] },
});
