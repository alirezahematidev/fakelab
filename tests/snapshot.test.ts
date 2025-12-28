import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { Config } from "../src/config/conf";
import type { ConfigOptions } from "../src/types";
import path from "node:path";
import fs from "fs-extra";
import { loadConfig } from "../src/load-config";

describe("Snapshot", () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), "tests", "fixtures", `snapshot-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);

    if (await fs.pathExists(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  function createConfig(options: ConfigOptions): Config {
    return new Config(options);
  }

  test("should initialize with default snapshot options", () => {
    const config = createConfig({
      sourcePath: ["./types"],
    });

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.enabled).toBe(false);
    expect(snapshotOptions.sources).toEqual([]);
  });

  test("should load snapshot options with enabled true", () => {
    const config = createConfig({
      sourcePath: ["./types"],
      snapshot: {
        enabled: true,
        sources: [],
      },
    });

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.enabled).toBe(true);
    expect(snapshotOptions.sources).toEqual([]);
  });

  test("should load snapshot options with sources", () => {
    const config = createConfig({
      sourcePath: ["./types"],
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

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.enabled).toBe(true);
    expect(snapshotOptions.sources).toHaveLength(2);
    expect(snapshotOptions.sources[0].name).toBe("Todo");
    expect(snapshotOptions.sources[0].url).toBe("https://jsonplaceholder.typicode.com/todos");
    expect(snapshotOptions.sources[1].name).toBe("Post");
    expect(snapshotOptions.sources[1].url).toBe("https://jsonplaceholder.typicode.com/posts");
  });

  test("should load snapshot options with headers", () => {
    const config = createConfig({
      sourcePath: ["./types"],
      snapshot: {
        enabled: true,
        sources: [
          {
            name: "User",
            url: "https://api.example.com/users",
            headers: {
              Authorization: "Bearer token123",
              "Content-Type": "application/json",
            },
          },
        ],
      },
    });

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.sources[0].headers).toBeDefined();
    const headers = snapshotOptions.sources[0].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token123");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  test("should use default values when snapshot options are not provided", () => {
    const config = createConfig({
      sourcePath: ["./types"],
    });

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.enabled).toBe(false);
    expect(snapshotOptions.sources).toEqual([]);
  });

  test("should work with loaded config", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  snapshot: {
    enabled: true,
    sources: [
      {
        name: "Todo",
        url: "https://jsonplaceholder.typicode.com/todos",
      },
    ],
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig();
    const snapshotOptions = config.options.snapshot();

    expect(snapshotOptions.enabled).toBe(true);
    expect(snapshotOptions.sources).toHaveLength(1);
    expect(snapshotOptions.sources[0].name).toBe("Todo");
    expect(snapshotOptions.sources[0].url).toBe("https://jsonplaceholder.typicode.com/todos");
  });

  test("should handle snapshot with multiple sources", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
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
      {
        name: "Comment",
        url: "https://jsonplaceholder.typicode.com/comments",
        headers: {
          Authorization: "Bearer token",
        },
      },
    ],
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig();
    const snapshotOptions = config.options.snapshot();

    expect(snapshotOptions.enabled).toBe(true);
    expect(snapshotOptions.sources).toHaveLength(3);
    expect(snapshotOptions.sources[0].name).toBe("Todo");
    expect(snapshotOptions.sources[1].name).toBe("Post");
    expect(snapshotOptions.sources[2].name).toBe("Comment");
    const headers = snapshotOptions.sources[2].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token");
  });

  test("should handle snapshot disabled", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  snapshot: {
    enabled: false,
    sources: [
      {
        name: "Todo",
        url: "https://jsonplaceholder.typicode.com/todos",
      },
    ],
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig();
    const snapshotOptions = config.options.snapshot();

    expect(snapshotOptions.enabled).toBe(false);
    expect(snapshotOptions.sources).toHaveLength(1);
  });

  test("should handle snapshot with empty sources array", () => {
    const config = createConfig({
      sourcePath: ["./types"],
      snapshot: {
        enabled: true,
        sources: [],
      },
    });

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.enabled).toBe(true);
    expect(snapshotOptions.sources).toEqual([]);
  });

  test("should handle snapshot sources without headers", () => {
    const config = createConfig({
      sourcePath: ["./types"],
      snapshot: {
        enabled: true,
        sources: [
          {
            name: "User",
            url: "https://api.example.com/users",
          },
        ],
      },
    });

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.sources[0].headers).toBeUndefined();
  });

  test("should handle complex snapshot configuration", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  server: {
    includeSnapshots: true,
  },
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
        headers: {
          "X-API-Key": "secret-key",
        },
      },
    ],
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig();
    const snapshotOptions = config.options.snapshot();
    const serverOptions = config.options.server();

    expect(snapshotOptions.enabled).toBe(true);
    expect(snapshotOptions.sources).toHaveLength(2);
    expect(serverOptions.includeSnapshots).toBe(true);
    const headers = snapshotOptions.sources[1].headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("secret-key");
  });
});
