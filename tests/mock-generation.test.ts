import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { prepareBuilder } from "../src/factory";
import { Config } from "../src/config/conf";
import { Database } from "../src/database";
import type { ConfigOptions } from "../src/types";
import path from "node:path";
import fs from "fs-extra";
import { loadConfig } from "../src/load-config";
import { constants } from "node:fs/promises";

describe("Mock Data Generation", () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Use a unique directory for each test to avoid conflicts
    const testId = Math.random().toString(36).substring(7);
    testDir = path.join(process.cwd(), "tests", "fixtures", testId);
    await fs.ensureDir(testDir, { mode: constants.R_OK | constants.W_OK });

    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create tsconfig.json for the parser
    await fs.writeFile(
      path.join(testDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            lib: ["ES2022"],
            skipLibCheck: true,
            moduleResolution: "bundler",
            strict: true,
          },
          include: ["types/**/*"],
        },
        null,
        2
      )
    );

    // Mock fs.appendFile to prevent modification of runtime.d.ts in src directory
    // The ParserEngine tries to write to src/runtime.d.ts, we need to prevent this
    vi.spyOn(fs, "appendFile").mockImplementation(async (filePath: any, ...args: any[]) => {
      // Only allow writes to test directories, block writes to src/runtime.d.ts
      const normalizedPath = path.normalize(String(filePath));
      if (normalizedPath.includes("src") && normalizedPath.includes("runtime.d.ts")) {
        // Silently ignore - don't modify the actual runtime.d.ts file
        return Promise.resolve();
      }
      // For other files, use the original implementation if needed
      // But in tests, we typically don't need this
      return Promise.resolve();
    });
  });

  afterEach(async () => {
    // Restore original appendFile
    vi.restoreAllMocks();

    process.chdir(originalCwd);

    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  async function createBuilder(options: ConfigOptions) {
    const config = new Config(options);
    const database = Database.register(config);
    await database.initialize();

    return await prepareBuilder(config, {}, database);
  }

  test("should generate mock data for simple interface", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export interface User {
  id: string;
  name: string;
  age: number;
  active: boolean;
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    expect(builder.entities.has("user")).toBe(true);

    const userEntity = builder.entities.get("user");
    expect(userEntity).toBeDefined();

    const result = await builder.build(userEntity!.type, {});

    expect(result.data).toBeDefined();
    expect(result.json).toBeDefined();

    const user = result.data as any;
    expect(typeof user.id).toBe("string");
    expect(typeof user.name).toBe("string");
    expect(typeof user.age).toBe("number");
    expect(typeof user.active).toBe("boolean");
  });

  test("should generate mock data with faker annotations", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export interface User {
  /** @faker string.uuid */
  id: string;
  
  /** @faker person.fullName */
  name: string;
  
  /** @faker number.int({ min: 18, max: 65 }) */
  age: number;
  
  /** @faker datatype.boolean */
  active: boolean;
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    const userEntity = builder.entities.get("user");
    expect(userEntity).toBeDefined();

    const result = await builder.build(userEntity!.type, {});

    const user = result.data as any;
    expect(typeof user.id).toBe("string");
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(typeof user.name).toBe("string");
    expect(user.name.length).toBeGreaterThan(0);
    expect(typeof user.age).toBe("number");
    expect(user.age).toBeGreaterThanOrEqual(18);
    expect(user.age).toBeLessThanOrEqual(65);
    expect(typeof user.active).toBe("boolean");
  });

  test("should generate multiple items when count is specified", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export interface User {
  id: string;
  name: string;
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, { count: "5" });

    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as any[]).length).toBe(5);

    (result.data as any[]).forEach((user) => {
      expect(typeof user.id).toBe("string");
      expect(typeof user.name).toBe("string");
    });
  });

  test("should generate mock data for nested interface", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "address.ts"),
      `export interface Address {
  street: string;
  city: string;
}`
    );

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `import { Address } from "./address";

export interface User {
  id: string;
  name: string;
  address: Address;
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, {});

    const user = result.data as any;
    expect(user.address).toBeDefined();
    expect(typeof user.address.street).toBe("string");
    expect(typeof user.address.city).toBe("string");
  });

  test("should generate mock data for array types", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export interface User {
  id: string;
  tags: string[];
  scores: number[];
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, {});

    const user = result.data as any;
    expect(Array.isArray(user.tags)).toBe(true);
    expect(user.tags.length).toBeGreaterThan(0);
    expect(typeof user.tags[0]).toBe("string");

    expect(Array.isArray(user.scores)).toBe(true);
    expect(user.scores.length).toBeGreaterThan(0);
    expect(typeof user.scores[0]).toBe("number");
  });

  test("should generate mock data for optional properties", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export interface User {
  id: string;
  name?: string;
  email?: string;
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, {});

    const user = result.data as any;
    expect(typeof user.id).toBe("string");
    // Optional properties may or may not be present
    if (user.name !== undefined) {
      expect(typeof user.name).toBe("string");
    }
    if (user.email !== undefined) {
      expect(typeof user.email).toBe("string");
    }
  });

  test("should generate mock data for union types", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export interface User {
  id: string;
  status: "active" | "inactive" | "pending";
  value: string | number;
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, {});

    const user = result.data as any;
    expect(["active", "inactive", "pending"]).toContain(user.status);
    expect(typeof user.value === "string" || typeof user.value === "number").toBe(true);
  });

  test("should generate mock data with loaded config", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export interface User {
  /** @faker string.uuid */
  id: string;
  
  /** @faker person.fullName */
  name: string;
}`
    );

    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  faker: {
    locale: "en",
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);

    const config = await loadConfig();
    const database = Database.register(config);
    await database.initialize();

    const builder = await prepareBuilder(config, {}, database);

    expect(builder.entities.has("user")).toBe(true);

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, {});

    const user = result.data as any;
    expect(typeof user.id).toBe("string");
    expect(typeof user.name).toBe("string");
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test("should generate valid JSON string", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export interface User {
  id: string;
  name: string;
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, {});

    expect(typeof result.json).toBe("string");

    // Should be valid JSON
    const parsed = JSON.parse(result.json);
    expect(parsed).toBeDefined();
    expect(typeof parsed.id).toBe("string");
    expect(typeof parsed.name).toBe("string");
  });

  test("should handle type aliases", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `export type User = {
  id: string;
  name: string;
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    expect(builder.entities.has("user")).toBe(true);

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, {});

    const user = result.data as any;
    expect(typeof user.id).toBe("string");
    expect(typeof user.name).toBe("string");
  });

  test("should generate mock data with complex nested structure", async () => {
    const typesDir = path.join(testDir, "types");
    await fs.ensureDir(typesDir);

    await fs.writeFile(
      path.join(typesDir, "profile.ts"),
      `export interface Profile {
  bio: string;
  avatar: string;
}`
    );

    await fs.writeFile(
      path.join(typesDir, "user.ts"),
      `import { Profile } from "./profile";

export interface User {
  id: string;
  name: string;
  profile: Profile;
  tags: string[];
}`
    );

    const builder = await createBuilder({
      sourcePath: ["./types"],
    });

    const userEntity = builder.entities.get("user");
    const result = await builder.build(userEntity!.type, {});

    const user = result.data as any;
    expect(user.profile).toBeDefined();
    expect(typeof user.profile.bio).toBe("string");
    expect(typeof user.profile.avatar).toBe("string");
    expect(Array.isArray(user.tags)).toBe(true);
  });
});
