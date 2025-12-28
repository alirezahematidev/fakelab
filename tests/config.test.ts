import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/load-config";
import path from "node:path";
import fs from "fs-extra";
import { FAKELAB_DEFAULT_PORT, FAKELABE_DEFAULT_PREFIX } from "../src/constants";

describe("Config Loading", () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), "tests", "fixtures", `test-${Date.now()}`);
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

  test("should load config with minimal options", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig({ cwd: testDir });

    expect(config).toBeDefined();
    expect(config.options.server().pathPrefix).toBe(FAKELABE_DEFAULT_PREFIX);
    expect(config.options.server().port).toBe(FAKELAB_DEFAULT_PORT);
    expect(config.options.server().includeSnapshots).toBe(true);
    expect(config.options.database().enabled).toBe(false);
    expect(config.options.faker().locale).toBeDefined();
  });

  test("should load config with all options", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: {
    port: 8080,
    pathPrefix: "api/v1",
    includeSnapshots: false,
  },
  faker: {
    locale: "fr",
  },
  database: {
    enabled: true,
  },
  network: {
    delay: [300, 1200],
    errorRate: 0.1,
    timeoutRate: 0.05,
    offline: false,
  },
  snapshot: {
    enabled: true,
    sources: [
      {
        name: "Test",
        url: "https://api.example.com/test",
      },
    ],
  },
  webhook: {
    enabled: true,
    hooks: [],
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "fixtures"));
    await fs.writeFile(path.join(testDir, "fixtures", "test.ts"), "export interface Test { id: string; }");

    const config = await loadConfig({ cwd: testDir });

    expect(config).toBeDefined();
    expect(config.options.server().port).toBe(8080);
    expect(config.options.server().pathPrefix).toBe("api/v1");
    expect(config.options.server().includeSnapshots).toBe(false);
    expect(config.options.faker().locale).toBe("fr");
    expect(config.options.database().enabled).toBe(true);
    expect(config.options.network().delay).toEqual([300, 1200]);
    expect(config.options.network().errorRate).toBe(0.1);
    expect(config.options.network().timeoutRate).toBe(0.05);
    expect(config.options.network().offline).toBe(false);
    expect(config.options.snapshot().enabled).toBe(true);
    expect(config.options.snapshot().sources).toHaveLength(1);
    expect(config.options.webhook().enabled).toBe(true);
    expect(config.options.webhook().hooks).toEqual([]);
  });

  test("should load config with array sourcePath", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types", "./fixtures"],
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.ensureDir(path.join(testDir, "fixtures"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");
    await fs.writeFile(path.join(testDir, "fixtures", "post.ts"), "export interface Post { id: string; }");

    const config = await loadConfig({ cwd: testDir });

    expect(config).toBeDefined();
    const files = await config.files();
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.includes("user.ts"))).toBe(true);
    expect(files.some((f) => f.includes("post.ts"))).toBe(true);
  });

  test("should load config with string sourcePath", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: "./types",
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig({ cwd: testDir });

    expect(config).toBeDefined();
    const files = await config.files();
    expect(files.length).toBeGreaterThan(0);
  });

  test("should use default values when options are not provided", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig({ cwd: testDir });

    expect(config.options.server().pathPrefix).toBe(FAKELABE_DEFAULT_PREFIX);
    expect(config.options.server().port).toBe(FAKELAB_DEFAULT_PORT);
    expect(config.options.database().enabled).toBe(false);
    expect(config.options.snapshot().enabled).toBe(false);
    expect(config.options.snapshot().sources).toEqual([]);
    expect(config.options.webhook().enabled).toBe(false);
    expect(config.options.webhook().hooks).toEqual([]);
  });

  test("should handle network preset configuration", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  network: {
    preset: "slow",
    presets: {
      slow: {
        delay: [1000, 2000],
        errorRate: 0.2,
      },
    },
    timeoutRate: 0.1,
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig({ cwd: testDir });

    expect(config).toBeDefined();
    const networkOptions = config.options.network();
    expect(networkOptions.delay).toEqual([1000, 2000]);
    expect(networkOptions.errorRate).toBe(0.2);
    expect(networkOptions.timeoutRate).toBe(0.1);
  });
});
