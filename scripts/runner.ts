import path from "node:path";
import { execa, type ResultPromise } from "execa";

export type Project = "node-express-webhook" | "react-typescript-vite";

type RunnerImpl = {
  [name in Project]: () => void;
};

export class Runner implements RunnerImpl {
  static readonly EXAMPLES_PATH = path.resolve(process.cwd(), "examples");

  private constructor() {}

  static start(project: Project) {
    new Runner()[project]();
  }

  async ["node-express-webhook"]() {
    const dev = execa("yarn", ["dev"], {
      cwd: path.resolve(Runner.EXAMPLES_PATH, "node-express-webhook"),
      stdio: "inherit",
      reject: false,
    });

    const serve = execa("yarn", ["serve"], {
      cwd: path.resolve(Runner.EXAMPLES_PATH, "node-express-webhook"),
      stdio: ["pipe", "pipe", "inherit"],
      reject: false,
    });

    process.on("SIGINT", () => {
      serve.kill("SIGINT");
      dev.kill("SIGINT");

      process.exit(0);
    });

    await dev;
    await serve;
  }

  async ["react-typescript-vite"]() {
    const serve = execa("yarn", ["serve"], {
      cwd: path.resolve(Runner.EXAMPLES_PATH, "react-typescript-vite"),
      stdio: ["pipe", "pipe", "inherit"],
      reject: false,
    });

    await this.wait(serve);

    const dev = execa("yarn", ["dev"], {
      cwd: path.resolve(Runner.EXAMPLES_PATH, "react-typescript-vite"),
      stdio: "inherit",
      reject: false,
    });

    process.on("SIGINT", () => {
      serve.kill("SIGINT");
      dev.kill("SIGINT");

      process.exit(0);
    });
    await dev;
  }

  private wait(serve: ResultPromise<{ stdio: ["pipe", "pipe", "inherit"]; reject: boolean }>) {
    return new Promise<void>((resolve, reject) => {
      serve.stdout?.on("data", (chunk) => {
        const output = chunk.toString();
        process.stdout.write(output);
        if (output.includes("Server listening to http://localhost")) resolve();
      });

      serve.on("exit", (code) => {
        reject(`Serve exited prematurely with code ${code}`);
        process.exit(1);
      });
    });
  }
}
