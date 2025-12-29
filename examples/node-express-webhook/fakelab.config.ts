import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: { port: 50003 },
  snapshot: {
    enabled: true,
  },
  webhook: {
    enabled: true,
    hooks: [
      {
        name: "server-started",
        url: "http://localhost:50002/server-started",
        method: "POST",
        trigger: { event: "server:started" },
      },
      {
        name: "server-shutdown",
        url: "http://localhost:50002/server-shutdown",
        method: "POST",
        trigger: { event: "server:shutdown" },
      },
      {
        name: "snapshot-captured",
        url: "http://localhost:50002/snapshot-captured",
        method: "POST",
        trigger: { event: "snapshot:captured" },
      },
      {
        name: "snapshot-refreshed",
        url: "http://localhost:50002/snapshot-refreshed",
        method: "POST",
        trigger: { event: "snapshot:refreshed" },
      },
      {
        name: "snapshot-deleted",
        url: "http://localhost:50002/snapshot-deleted",
        method: "POST",
        trigger: { event: "snapshot:deleted" },
      },
    ],
  },
});
