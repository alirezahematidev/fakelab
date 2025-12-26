import { defineConfig } from "./src/main";

export default defineConfig({
  sourcePath: [],
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
});
