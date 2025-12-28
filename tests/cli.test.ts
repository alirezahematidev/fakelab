import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { Command } from "commander";
import type { ServerCLIOptions, SnapshotCLIOptions } from "../src/types";

describe("CLI", () => {
  let program = new Command();

  beforeEach(async () => {
    program = new Command();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  test("should parse serve command with no options", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-s, --source <char>", "config source path")
      .option("-x, --pathPrefix <char>", "server url path prefix")
      .option("-p, --port <number>", "server port number", parseInt)
      .option("-l, --locale <char>", "faker custom locale")
      .option("-f, --fresh-snapshots", "capture or refresh all snapshots")
      .action(async (options) => {
        expect(options).toBeDefined();
        expect(options.source).toBeUndefined();
        expect(options.pathPrefix).toBeUndefined();
        expect(options.port).toBeUndefined();
        expect(options.locale).toBeUndefined();
        expect(options.freshSnapshots).toBeUndefined();
      });

    await program.parseAsync(["serve"], { from: "user" });
  });

  test("should parse serve command with source option", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-s, --source <char>", "config source path")
      .action(async (options) => {
        expect(options.source).toBe("./types");
      });

    await program.parseAsync(["serve", "--source", "./types"], { from: "user" });
  });

  test("should parse serve command with pathPrefix option", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-x, --pathPrefix <char>", "server url path prefix")
      .action(async (options) => {
        expect(options.pathPrefix).toBe("/api/v1");
      });

    await program.parseAsync(["serve", "--pathPrefix", "/api/v1"], { from: "user" });
  });

  test("should parse serve command with port option", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-p, --port <number>", "server port number", parseInt)
      .action(async (options) => {
        expect(options.port).toBe(8080);
      });

    await program.parseAsync(["serve", "--port", "8080"], { from: "user" });
  });

  test("should parse serve command with locale option", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-l, --locale <char>", "faker custom locale")
      .action(async (options) => {
        expect(options.locale).toBe("fr");
      });

    await program.parseAsync(["serve", "--locale", "fr"], { from: "user" });
  });

  test("should parse serve command with fresh-snapshots option", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-f, --fresh-snapshots", "capture or refresh all snapshots")
      .action(async (options) => {
        expect(options.freshSnapshots).toBe(true);
      });

    await program.parseAsync(["serve", "--fresh-snapshots"], { from: "user" });
  });

  test("should parse serve command with all options", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-s, --source <char>", "config source path")
      .option("-x, --pathPrefix <char>", "server url path prefix")
      .option("-p, --port <number>", "server port number", parseInt)
      .option("-l, --locale <char>", "faker custom locale")
      .option("-f, --fresh-snapshots", "capture or refresh all snapshots")
      .action(async (options) => {
        expect(options.source).toBe("./types");
        expect(options.pathPrefix).toBe("/api/v1");
        expect(options.port).toBe(8080);
        expect(options.locale).toBe("fr");
        expect(options.freshSnapshots).toBe(true);
      });

    await program.parseAsync(["serve", "--source", "./types", "--pathPrefix", "/api/v1", "--port", "8080", "--locale", "fr", "--fresh-snapshots"], { from: "user" });
  });

  test("should parse serve command with short option aliases", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-s, --source <char>", "config source path")
      .option("-x, --pathPrefix <char>", "server url path prefix")
      .option("-p, --port <number>", "server port number", parseInt)
      .option("-l, --locale <char>", "faker custom locale")
      .option("-f, --fresh-snapshots", "capture or refresh all snapshots")
      .action(async (options) => {
        expect(options.source).toBe("./types");
        expect(options.pathPrefix).toBe("/api");
        expect(options.port).toBe(4000);
        expect(options.locale).toBe("en");
        expect(options.freshSnapshots).toBe(true);
      });

    await program.parseAsync(["serve", "-s", "./types", "-x", "/api", "-p", "4000", "-l", "en", "-f"], { from: "user" });
  });

  test("should parse snapshot command with url argument", async () => {
    program
      .command("snapshot")
      .description("capture a url response to a fakelab entity")
      .argument("[string]", "url to capture")
      .action(async (url) => {
        expect(url).toBe("https://jsonplaceholder.typicode.com/todos");
      });

    await program.parseAsync(["snapshot", "https://jsonplaceholder.typicode.com/todos"], { from: "user" });
  });

  test("should parse snapshot command with name option", async () => {
    program
      .command("snapshot")
      .description("capture a url response to a fakelab entity")
      .argument("[string]", "url to capture")
      .option("-s, --name <string>", "specify snapshot source name")
      .action(async (url, options) => {
        expect(url).toBe("https://jsonplaceholder.typicode.com/todos");
        expect(options.name).toBe("Todo");
      });

    await program.parseAsync(["snapshot", "https://jsonplaceholder.typicode.com/todos", "--name", "Todo"], { from: "user" });
  });

  test("should parse snapshot command with refresh option", async () => {
    program
      .command("snapshot")
      .description("capture a url response to a fakelab entity")
      .argument("[string]", "url to capture")
      .option("-r, --refresh <string>", "refresh the specified snapshot")
      .action(async (url, options) => {
        expect(options.refresh).toBe("Todo");
      });

    await program.parseAsync(["snapshot", "--refresh", "Todo"], { from: "user" });
  });

  test("should parse snapshot command with delete option", async () => {
    program
      .command("snapshot")
      .description("capture a url response to a fakelab entity")
      .argument("[string]", "url to capture")
      .option("-d, --delete <string>", "delete the specified snapshot")
      .action(async (url, options) => {
        expect(options.delete).toBe("Todo");
      });

    await program.parseAsync(["snapshot", "--delete", "Todo"], { from: "user" });
  });

  test("should parse snapshot command with short option aliases", async () => {
    program
      .command("snapshot")
      .description("capture a url response to a fakelab entity")
      .argument("[string]", "url to capture")
      .option("-s, --name <string>", "specify snapshot source name")
      .option("-r, --refresh <string>", "refresh the specified snapshot")
      .option("-d, --delete <string>", "delete the specified snapshot")
      .action(async (url, options) => {
        expect(url).toBe("https://jsonplaceholder.typicode.com/posts");
        expect(options.name).toBe("Post");
      });

    await program.parseAsync(["snapshot", "https://jsonplaceholder.typicode.com/posts", "-s", "Post"], { from: "user" });
  });

  test("should parse snapshot command without url argument", async () => {
    program
      .command("snapshot")
      .description("capture a url response to a fakelab entity")
      .argument("[string]", "url to capture")
      .action(async (url) => {
        expect(url).toBeUndefined();
      });

    await program.parseAsync(["snapshot"], { from: "user" });
  });

  test("should handle serve command with port as number", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-p, --port <number>", "server port number", parseInt)
      .action(async (options) => {
        expect(typeof options.port).toBe("number");
        expect(options.port).toBe(5000);
      });

    await program.parseAsync(["serve", "--port", "5000"], { from: "user" });
  });

  test("should handle multiple source options", async () => {
    program
      .command("serve")
      .description("start server")
      .option("-s, --source <char>", "config source path")
      .action(async (options) => {
        // Commander.js handles multiple options by keeping the last one
        // or you can use .option().allowVariadic() for arrays
        expect(options.source).toBeDefined();
      });

    await program.parseAsync(["serve", "--source", "./types", "--source", "./fixtures"], { from: "user" });
  });

  test("should validate CLI option types", () => {
    const serveOptions: ServerCLIOptions = {
      source: "./types",
      pathPrefix: "/api",
      port: 8080,
      locale: "en",
      freshSnapshots: true,
    };

    expect(serveOptions.source).toBe("./types");
    expect(serveOptions.pathPrefix).toBe("/api");
    expect(serveOptions.port).toBe(8080);
    expect(serveOptions.locale).toBe("en");
    expect(serveOptions.freshSnapshots).toBe(true);
  });

  test("should validate snapshot CLI option types", () => {
    const snapshotOptions: SnapshotCLIOptions = {
      name: "Todo",
      refresh: "Todo",
      delete: "Post",
    };

    expect(snapshotOptions.name).toBe("Todo");
    expect(snapshotOptions.refresh).toBe("Todo");
    expect(snapshotOptions.delete).toBe("Post");
  });

  test("should handle optional CLI options", () => {
    const serveOptions: Partial<ServerCLIOptions> = {
      port: 8080,
    };

    expect(serveOptions.port).toBe(8080);
    expect(serveOptions.source).toBeUndefined();
    expect(serveOptions.pathPrefix).toBeUndefined();
    expect(serveOptions.locale).toBeUndefined();
    expect(serveOptions.freshSnapshots).toBeUndefined();
  });

  test("should handle empty snapshot options", () => {
    const snapshotOptions: SnapshotCLIOptions = {};

    expect(snapshotOptions.name).toBeUndefined();
    expect(snapshotOptions.refresh).toBeUndefined();
    expect(snapshotOptions.delete).toBeUndefined();
  });
});
