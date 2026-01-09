import { describe, expect, test, vi } from "vitest";
import { Network } from "../src/network";
import { Config } from "../src/config/config";
import type { ConfigOptions } from "../src/types";
import path from "path";

describe("Network", () => {
  function createNetwork(options: ConfigOptions): Network {
    return Network.initHandlers(new Config(options));
  }

  test("should initialize with default network options", () => {
    const network = createNetwork({
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    expect(network).toBeDefined();
    expect(network.offline()).toBe(false);
  });

  test("should handle fixed delay", async () => {
    const network = createNetwork({
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
    });

    const start = Date.now();
    await network.wait();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  test("should simulate error rate", () => {
    const network = createNetwork({
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
      network: {
        offline: true,
      },
    });

    expect(network.offline()).toBe(true);
  });

  test("should return offline state", () => {
    const network = createNetwork({
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
      sourcePath: [path.join(__dirname, "fixtures/types")],
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
});
