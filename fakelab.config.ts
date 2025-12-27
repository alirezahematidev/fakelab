import { defineConfig } from "./src/main";

export default defineConfig({
  sourcePath: ["./types"],
  server: { port: 50001 },
  snapshot: {
    enabled: true,
  },
  webhook: {
    enabled: true,
    hooks: [
      {
        name: "snapshot-captured",
        method: "POST",
        trigger: { event: "snapshot:captured" },
        url: "http://localhost:5000/snapshot-captured",
      },
      {
        name: "snapshot-deleted",
        method: "POST",
        trigger: { event: "snapshot:deleted" },
        url: "http://localhost:5000/snapshot-deleted",
      },
    ],
  },
});
