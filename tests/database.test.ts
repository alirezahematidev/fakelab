import { describe, expect, test } from "vitest";
import { Database } from "../src/database";
import { Config } from "../src/config/conf";
import fs from "fs-extra";
import path from "path";

describe("Database", () => {
  test("should initialize with default database options", () => {
    const database = Database.register(new Config({ sourcePath: [path.join(__dirname, "fixtures/types")] }));

    expect(database).toBeDefined();
    expect(database.enabled()).toBe(false);
  });

  test("should return enabled true when database is enabled", () => {
    const database = Database.register(new Config({ sourcePath: [path.join(__dirname, "fixtures/types")], database: { enabled: true } }));

    expect(database).toBeDefined();
    expect(database.enabled()).toBe(true);
  });

  test("should return enabled false when database is disabled", () => {
    const database = Database.register(new Config({ sourcePath: [path.join(__dirname, "fixtures/types")], database: { enabled: false } }));

    expect(database).toBeDefined();
    expect(database.enabled()).toBe(false);

    expect(fs.existsSync(database.DATABASE_DIR)).toBe(false);
  });

  test("should initialize database directory when enabled", async () => {
    const database = Database.register(new Config({ sourcePath: [path.join(__dirname, "fixtures/types")], database: { enabled: true } }));

    expect(database).toBeDefined();

    await database.initialize();

    expect(database.enabled()).toBe(true);

    expect(fs.existsSync(database.DATABASE_DIR)).toBe(true);
  });

  test("should not initialize database directory when disabled", async () => {
    const database = Database.register(new Config({ sourcePath: [path.join(__dirname, "fixtures/types")], database: { enabled: false } }));

    expect(database).toBeDefined();

    await database.initialize();

    expect(database.enabled()).toBe(false);

    expect(fs.existsSync(database.DATABASE_DIR)).toBe(false);
  });
});
