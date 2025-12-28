import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { Database } from "../src/database";
import { Config } from "../src/config/conf";
import type { ConfigOptions } from "../src/types";
import path from "node:path";
import fs from "fs-extra";
import { loadConfig } from "../src/load-config";

describe("Database", () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), "tests", "fixtures", `database-test-${Date.now()}`);
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

  function createDatabase(options: ConfigOptions): Database {
    const config = createConfig(options);
    return Database.register(config);
  }

  test("should initialize with default database options", () => {
    const database = createDatabase({
      sourcePath: ["./types"],
    });

    expect(database).toBeDefined();
    expect(database.enabled()).toBe(false);
  });

  test("should return enabled true when database is enabled", () => {
    const database = createDatabase({
      sourcePath: ["./types"],
      database: {
        enabled: true,
      },
    });

    expect(database.enabled()).toBe(true);
  });

  test("should return enabled false when database is disabled", () => {
    const database = createDatabase({
      sourcePath: ["./types"],
      database: {
        enabled: false,
      },
    });

    expect(database.enabled()).toBe(false);
  });

  test("should remove database directory when disabled", () => {
    const database = createDatabase({
      sourcePath: ["./types"],
      database: {
        enabled: false,
      },
    });

    expect(database.enabled()).toBe(false);
    // Database directory should be removed when disabled
    expect(fs.existsSync(database.DATABASE_DIR)).toBe(false);
  });

  test("should initialize database directory when enabled", async () => {
    const database = createDatabase({
      sourcePath: ["./types"],
      database: {
        enabled: true,
      },
    });

    await database.initialize();

    expect(database.enabled()).toBe(true);
    expect(await fs.pathExists(database.DATABASE_DIR)).toBe(true);
  });

  test("should not initialize database directory when disabled", async () => {
    const database = createDatabase({
      sourcePath: ["./types"],
      database: {
        enabled: false,
      },
    });

    await database.initialize();

    expect(database.enabled()).toBe(false);
    expect(await fs.pathExists(database.DATABASE_DIR)).toBe(false);
  });

  test("should have correct database directory path", () => {
    const database = createDatabase({
      sourcePath: ["./types"],
      database: {
        enabled: true,
      },
    });

    // CWD is set at module load time to the project root, not the test directory
    // So the database directory path is relative to the project root
    // We need to get the original CWD from before we changed directories
    const projectRoot = originalCwd;
    const expectedPath = path.resolve(projectRoot, ".fakelab/db");
    expect(database.DATABASE_DIR).toBe(expectedPath);
  });

  test("should work with loaded config", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  database: {
    enabled: true,
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig();
    const database = Database.register(config);

    expect(database).toBeDefined();
    expect(database.enabled()).toBe(true);

    await database.initialize();
    expect(await fs.pathExists(database.DATABASE_DIR)).toBe(true);
  });

  test("should handle database disabled in loaded config", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  database: {
    enabled: false,
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig();
    const database = Database.register(config);

    expect(database.enabled()).toBe(false);
    expect(await fs.pathExists(database.DATABASE_DIR)).toBe(false);
  });

  test("should handle database not specified in config", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig();
    const database = Database.register(config);

    expect(database.enabled()).toBe(false);
  });

  test("should create database directory structure", async () => {
    const database = createDatabase({
      sourcePath: ["./types"],
      database: {
        enabled: true,
      },
    });

    await database.initialize();

    const dbDir = database.DATABASE_DIR;
    expect(await fs.pathExists(dbDir)).toBe(true);

    const stats = await fs.stat(dbDir);
    expect(stats.isDirectory()).toBe(true);
  });

  test("should handle multiple database instances with same config", () => {
    const config = createConfig({
      sourcePath: ["./types"],
      database: {
        enabled: true,
      },
    });

    const db1 = Database.register(config);
    const db2 = Database.register(config);

    expect(db1.enabled()).toBe(true);
    expect(db2.enabled()).toBe(true);
    expect(db1.DATABASE_DIR).toBe(db2.DATABASE_DIR);
  });

  test("should handle database initialization error gracefully", async () => {
    const database = createDatabase({
      sourcePath: ["./types"],
      database: {
        enabled: true,
      },
    });

    // Mock fs.ensureDir to throw an error
    const originalEnsureDir = fs.ensureDir;
    vi.spyOn(fs, "ensureDir").mockRejectedValueOnce(new Error("Permission denied"));

    // Should not throw, but handle error gracefully
    await expect(database.initialize()).resolves.not.toThrow();

    vi.restoreAllMocks();
  });

  test("should use default database options when not provided", () => {
    const database = createDatabase({
      sourcePath: ["./types"],
    });

    expect(database.enabled()).toBe(false);
  });

  test("should handle complex configuration with database", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  server: {
    port: 8080,
  },
  database: {
    enabled: true,
  },
  network: {
    delay: 500,
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig();
    const database = Database.register(config);

    expect(database.enabled()).toBe(true);

    await database.initialize();
    expect(await fs.pathExists(database.DATABASE_DIR)).toBe(true);
  });
});
