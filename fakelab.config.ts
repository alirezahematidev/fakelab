import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  enabled: false,
  server: { port: 50001, includeSnapshots: true },
  snapshot: {
    enabled: true,
    sources: [
      {
        name: "Todo",
        url: "https://jsonplaceholder.typicode.com/todos",
      },
      {
        name: "Post",
        url: "https://jsonplaceholder.typicode.com/posts",
      },
    ],
  },
  database: { enabled: true },
  graphql: { enabled: true },
  network: { delay: [500, 1500] },
});
