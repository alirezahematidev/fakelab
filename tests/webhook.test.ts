import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { ServerEventSubscriber } from "../src/events/subscribers";
import { Webhook } from "../src/webhook";
import { Config } from "../src/config/conf";
import path from "path";

describe("Webhook", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let subscriber: ServerEventSubscriber;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    global.fetch = mockFetch as typeof global.fetch;
    subscriber = new ServerEventSubscriber();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("should initialize webhook with default state", () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: { enabled: true, hooks: [] },
    });

    const webhook = new Webhook(subscriber, config);

    expect(webhook.isActivated()).toBe(false);
  });

  test("should activate webhook when enabled and hooks are configured", () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    expect(webhook.isActivated()).toBe(true);
  });

  test("should not activate webhook when disabled", () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: false,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    expect(webhook.isActivated()).toBe(false);
  });

  test("should not activate webhook when no hooks are configured", () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    expect(webhook.isActivated()).toBe(false);
  });

  test("should trigger webhook when event is fired", async () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    subscriber.started({ port: 5000, pathPrefix: "/api", includeSnapshots: false });

    // Wait for async webhook call
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:5000/webhook",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ port: 5000, prefix: "/api" }),
        signal: expect.any(AbortSignal),
        headers: expect.any(Headers),
      })
    );
  });

  test("should include correct headers in webhook request", async () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    subscriber.started({ port: 5000, pathPrefix: "", includeSnapshots: false });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1].headers as Headers;

    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-Fakelab-Webhook")).toBe("name=server-started,event=server:started");
  });

  test("should include custom headers in webhook request", async () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
            headers: {
              Authorization: "Bearer token123",
              "X-Custom-Header": "custom-value",
            },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    subscriber.started({ port: 5000, pathPrefix: "", includeSnapshots: false });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1].headers as Headers;

    expect(headers.get("Authorization")).toBe("Bearer token123");
    expect(headers.get("X-Custom-Header")).toBe("custom-value");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  test("should transform payload when transform function is provided", async () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
            transform: (data: any) => ({
              transformed: true,
              port: data.port,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    subscriber.started({ port: 5000, pathPrefix: "/api", includeSnapshots: false });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body as string);

    expect(body.transformed).toBe(true);
    expect(body.port).toBe(5000);
    expect(body.timestamp).toBeDefined();
    expect(body.prefix).toBeUndefined();
  });

  test("should handle multiple hooks for different events", async () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook/started",
            method: "POST",
            trigger: { event: "server:started" },
          },
          {
            name: "server-shutdown",
            url: "http://localhost:5000/webhook/shutdown",
            method: "POST",
            trigger: { event: "server:shutdown" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    subscriber.started({ port: 5000, pathPrefix: "", includeSnapshots: false });
    subscriber.shutdown({ port: 5000, pathPrefix: "", includeSnapshots: false });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:5000/webhook/started", expect.any(Object));
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:5000/webhook/shutdown", expect.any(Object));
  });

  test("should handle webhook request failure gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    subscriber.started({ port: 5000, pathPrefix: "", includeSnapshots: false });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("should handle network errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    subscriber.started({ port: 5000, pathPrefix: "", includeSnapshots: false });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("should handle transform function errors gracefully", async () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
            transform: () => {
              throw new Error("Transform error");
            },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    subscriber.started({ port: 5000, pathPrefix: "", includeSnapshots: false });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should still send webhook with original data when transform fails
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body as string);
    expect(body.port).toBe(5000);
  });

  test("should skip invalid hooks during activation", () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "invalid-method",
            url: "http://localhost:5000/webhook",
            method: "GET" as any,
            trigger: { event: "server:started" },
          },
          {
            name: "valid-hook",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    // Should still activate with valid hooks
    expect(webhook.isActivated()).toBe(true);
  });

  test("should skip hooks with invalid URLs during activation", () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "invalid-url",
            url: "not-a-valid-url",
            method: "POST",
            trigger: { event: "server:started" },
          },
          {
            name: "valid-hook",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    expect(webhook.isActivated()).toBe(true);
  });

  test("should skip hooks with non-http/https URLs", () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "invalid-protocol",
            url: "ftp://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
          {
            name: "valid-hook",
            url: "https://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    expect(webhook.isActivated()).toBe(true);
  });

  test("should not trigger webhook for unsubscribed events", async () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();

    // Trigger shutdown event which is not subscribed
    subscriber.shutdown({ port: 5000, pathPrefix: "", includeSnapshots: false });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("should handle reactivation correctly", () => {
    const config = new Config({
      sourcePath: [path.join(__dirname, "fixtures/types")],
      webhook: {
        enabled: true,
        hooks: [
          {
            name: "server-started",
            url: "http://localhost:5000/webhook",
            method: "POST",
            trigger: { event: "server:started" },
          },
        ],
      },
    });

    const webhook = new Webhook(subscriber, config);
    webhook.activate();
    expect(webhook.isActivated()).toBe(true);

    // Reactivate
    webhook.activate();
    expect(webhook.isActivated()).toBe(true);
  });
});
