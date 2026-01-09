import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { prepareBuilder } from "../src/factory";
import { Config } from "../src/config/config";
import { Database } from "../src/database";
import type { ConfigOptions } from "../src/types";
import path from "node:path";
import fs from "fs-extra";

describe("Factory", () => {
  beforeEach(() => {
    vi.spyOn(fs, "appendFile").mockImplementation(async () => {
      return Promise.resolve();
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  async function createBuilder(options: ConfigOptions) {
    const config = new Config(options);
    const database = Database.register(config);
    await database.initialize();

    return await prepareBuilder(config, {});
  }

  test("should generate data for simple interface", async () => {
    const builder = await createBuilder({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(builder.entities.has("user")).toBe(true);

    const userEntity = builder.entities.get("user");
    expect(userEntity).toBeDefined();

    const result = await builder.build("user", userEntity!.type, {});

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const user = result.data as any;
    expect(typeof user.id).toBe("string");
    expect(typeof user.name).toBe("string");
    expect(typeof user.age).toBe("number");
    expect(typeof user.active).toBe("boolean");
  });

  test("should generate multiple of data if count is specified", async () => {
    const builder = await createBuilder({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(builder.entities.has("user")).toBe(true);

    const userEntity = builder.entities.get("user");
    expect(userEntity).toBeDefined();

    const result = await builder.build("user", userEntity!.type, { count: 10 });

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const user = result.data as any;
    expect(Array.isArray(user)).toBe(true);
    expect(user.length).toBe(10);
    expect(typeof user[0].name).toBe("string");
    expect(typeof user[0].age).toBe("number");
    expect(typeof user[0].active).toBe("boolean");
  });

  test("should generate a single data if count set to zero", async () => {
    const builder = await createBuilder({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(builder.entities.has("user")).toBe(true);

    const userEntity = builder.entities.get("user");
    expect(userEntity).toBeDefined();

    const result = await builder.build("user", userEntity!.type, { count: 0 });

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const user = result.data as any;

    expect(Array.isArray(user)).toBe(false);

    expect(typeof user.name).toBe("string");
  });

  test("should generate a empty array if count set to negative integer", async () => {
    const builder = await createBuilder({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(builder.entities.has("user")).toBe(true);

    const userEntity = builder.entities.get("user");
    expect(userEntity).toBeDefined();

    const result = await builder.build("user", userEntity!.type, { count: -1 });

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const user = result.data as any;

    expect(Array.isArray(user)).toBe(true);

    expect(user.length).toBe(0);
  });

  test("should generate data with faker annotations", async () => {
    const builder = await createBuilder({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(builder.entities.has("profile")).toBe(true);

    const profileEntity = builder.entities.get("profile");
    expect(profileEntity).toBeDefined();

    const result = await builder.build("profile", profileEntity!.type, {});

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const profile = result.data as any;

    expect(typeof profile.id).toBe("string");
    expect(profile.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(profile.age).toBeGreaterThanOrEqual(1);
    expect(profile.age).toBeLessThanOrEqual(10);
  });

  test("should generate data for nested interface", async () => {
    const builder = await createBuilder({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(builder.entities.has("profile")).toBe(true);

    const profileEntity = builder.entities.get("profile");
    expect(profileEntity).toBeDefined();

    const result = await builder.build("profile", profileEntity!.type, {});

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const profile = result.data as any;

    expect(profile.user).toBeDefined();
    expect(typeof profile.user.name).toBe("string");
    expect(typeof profile.user.age).toBe("number");
    expect(typeof profile.user.active).toBe("boolean");
  });

  test("should generate data for array types", async () => {
    const builder = await createBuilder({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(builder.entities.has("product")).toBe(true);

    const productEntity = builder.entities.get("product");
    expect(productEntity).toBeDefined();

    const result = await builder.build("product", productEntity!.type, {});

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const product = result.data as any;

    expect(Array.isArray(product.tags)).toBe(true);
    expect(typeof product.tags[0]).toBe("string");
  });

  test("should generate mock data for union types", async () => {
    const builder = await createBuilder({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(builder.entities.has("product")).toBe(true);

    const productEntity = builder.entities.get("product");
    expect(productEntity).toBeDefined();

    const result = await builder.build("product", productEntity!.type, {});

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const product = result.data as any;

    expect(["active", "inactive", "pending"]).toContain(product.status);
    expect(typeof product.value === "string" || typeof product.value === "number").toBe(true);
  });
});
