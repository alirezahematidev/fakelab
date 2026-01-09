import { describe, expect, test } from "vitest";
import { Config } from "../src/config/config";
import type { ConfigOptions } from "../src/types";
import path from "path";

describe("Snapshot", () => {
  function createConfig(options: ConfigOptions): Config {
    return new Config(options);
  }

  test("should initialize with default snapshot options", () => {
    const config = createConfig({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.enabled).toBe(false);
    expect(snapshotOptions.sources).toEqual([]);
  });

  test("should load snapshot options with enabled true", () => {
    const config = createConfig({
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    const snapshotOptions = config.options.snapshot();
    expect(snapshotOptions.enabled).toBe(false);
    expect(snapshotOptions.sources).toEqual([]);
  });

  test("should handle snapshot with empty sources array", () => {
    const config = createConfig({
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
});
