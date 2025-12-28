import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { Network } from "../src/network";
import { Config } from "../src/config/conf";
import type { ConfigOptions } from "../src/types";
import path from "node:path";
import fs from "fs-extra";
import { loadConfig } from "../src/load-config";

describe("Network", () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), "tests", "fixtures", `network-test-${Date.now()}`);
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

  function createNetwork(options: ConfigOptions): Network {
    const config = createConfig(options);
    return Network.initHandlers(config);
  }

  test("should initialize with default network options", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
    });

    expect(network).toBeDefined();
    expect(network.offline()).toBe(false);
  });

  test("should handle fixed delay", async () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        delay: 500,
      },
    });

    const start = Date.now();
    await network.wait();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(450);
    expect(elapsed).toBeLessThan(600);
  });

  test("should handle delay range", async () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        delay: [200, 400],
      },
    });

    const delays: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await network.wait();
      const elapsed = Date.now() - start;
      delays.push(elapsed);
    }

    const minDelay = Math.min(...delays);
    const maxDelay = Math.max(...delays);

    expect(minDelay).toBeGreaterThanOrEqual(150);
    expect(maxDelay).toBeLessThan(500);
  });

  test("should handle zero delay", async () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        delay: 0,
      },
    });

    const start = Date.now();
    await network.wait();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  test("should handle no delay configuration", async () => {
    const network = createNetwork({
      sourcePath: ["./types"],
    });

    const start = Date.now();
    await network.wait();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  test("should simulate error rate", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        errorRate: 1.0,
      },
    });

    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(network.error());
    }

    expect(results.every((r) => r === true)).toBe(true);
  });

  test("should simulate zero error rate", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        errorRate: 0,
      },
    });

    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(network.error());
    }

    expect(results.every((r) => r === false)).toBe(true);
  });

  test("should simulate timeout rate", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        timeoutRate: 1.0,
      },
    });

    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(network.timeout());
    }

    expect(results.every((r) => r === true)).toBe(true);
  });

  test("should simulate zero timeout rate", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        timeoutRate: 0,
      },
    });

    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(network.timeout());
    }

    expect(results.every((r) => r === false)).toBe(true);
  });

  test("should handle offline mode", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        offline: true,
      },
    });

    expect(network.offline()).toBe(true);
  });

  test("should return offline state", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        offline: true,
      },
    });

    const state = network.state("offline");
    expect(state.status).toBe(503);
    expect(state.message).toBe("Network offline");
  });

  test("should return error state with default values", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        errorRate: 1.0,
      },
    });

    const state = network.state("error");
    expect(state.status).toBe(500);
    expect(state.message).toBe("Network error");
  });

  test("should return error state with custom status codes", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        errorRate: 1.0,
        errors: {
          statusCodes: [400, 404, 500],
        },
      },
    });

    const states: Array<{ status: number; message: string }> = [];
    for (let i = 0; i < 20; i++) {
      states.push(network.state("error"));
    }

    const statusCodes = states.map((s) => s.status);
    expect(statusCodes.some((code) => [400, 404, 500].includes(code))).toBe(true);
  });

  test("should handle network presets", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        presets: {
          slow: {
            delay: [1000, 2000],
            errorRate: 0.2,
          },
          fast: {
            delay: [50, 100],
            errorRate: 0.01,
          },
        },
        preset: "slow",
      },
    });

    expect(network).toBeDefined();
  });

  test("should override preset with inline options", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        presets: {
          slow: {
            delay: [1000, 2000],
            errorRate: 0.2,
          },
        },
        preset: "slow",
        delay: [100, 200],
        errorRate: 0.5,
      },
    });

    expect(network).toBeDefined();
  });

  test("should set network headers in middleware", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        delay: 500,
        errorRate: 0.1,
        timeoutRate: 0.05,
        offline: false,
      },
    });

    const req = {} as any;
    const res = {
      setHeader: vi.fn(),
    } as any;
    const next = vi.fn();

    network.middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Fakelab-Network", expect.stringMatching(/delay=500,error=0\.1,timeout=0\.05,offline=false/));
    expect(next).toHaveBeenCalled();
  });

  test("should set network headers with offline mode", () => {
    const network = createNetwork({
      sourcePath: ["./types"],
      network: {
        offline: true,
      },
    });

    const req = {} as any;
    const res = {
      setHeader: vi.fn(),
    } as any;
    const next = vi.fn();

    network.middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Fakelab-Network", expect.stringMatching(/offline=true/));
    expect(next).toHaveBeenCalled();
  });

  test("should work with loaded config", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  network: {
    delay: [300, 600],
    errorRate: 0.15,
    timeoutRate: 0.1,
    errors: {
      statusCodes: [400, 500],
      messages: {
        400: "Bad Request",
        500: "Server Error",
      },
    },
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig({ cwd: testDir });
    const network = Network.initHandlers(config);

    expect(network).toBeDefined();
    expect(network.offline()).toBe(false);

    const start = Date.now();
    await network.wait();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(250);
    expect(elapsed).toBeLessThan(700);
  });

  test("should handle complex preset configuration", async () => {
    const configContent = `
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types"],
  network: {
    presets: {
      "3g": {
        delay: [500, 2000],
        errorRate: 0.05,
      },
      "slow-3g": {
        delay: [2000, 5000],
        errorRate: 0.1,
        timeoutRate: 0.05,
      },
      offline: {
        offline: true,
      },
    },
    preset: "3g",
    timeoutRate: 0.02,
  },
});
`;

    await fs.writeFile(path.join(testDir, "fakelab.config.ts"), configContent);
    await fs.ensureDir(path.join(testDir, "types"));
    await fs.writeFile(path.join(testDir, "types", "user.ts"), "export interface User { id: string; }");

    const config = await loadConfig({ cwd: testDir });
    const network = Network.initHandlers(config);

    expect(network).toBeDefined();
    expect(network.offline()).toBe(false);
  });
});
