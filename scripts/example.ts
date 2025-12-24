import glob from "fast-glob";
import path from "node:path";
import fs from "fs-extra";
import { execa, type ResultPromise } from "execa";
import { select } from "@inquirer/prompts";

const EXAMPLES_PATH = path.resolve(process.cwd(), "examples");

function wait(serve: ResultPromise<{ stdio: ["pipe", "pipe", "inherit"]; reject: boolean }>) {
  return new Promise<void>((resolve, reject) => {
    serve.stdout?.on("data", (chunk) => {
      const output = chunk.toString();
      process.stdout.write(output);
      if (output.includes("server listening to http://localhost")) resolve();
    });

    serve.on("exit", (code) => {
      reject(`Serve exited prematurely with code ${code}`);
      process.exit(1);
    });
  });
}

async function run() {
  const choices = await glob("./*", { onlyDirectories: true, cwd: EXAMPLES_PATH });

  const example = await select({ message: "Select a example project", choices });

  const target = path.resolve(EXAMPLES_PATH, example);

  await execa("yarn", ["link"], {
    cwd: process.cwd(),
  });

  await execa("yarn", ["build"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (!fs.existsSync(path.join(target, "node_modules/fakelab"))) {
    await execa("yarn", ["link", "fakelab"], {
      cwd: target,
      stdio: "inherit",
    });
  }

  await execa("yarn", ["install", "--check-files"], {
    cwd: target,
    stdio: "inherit",
  });

  const serve = execa("yarn", ["serve"], {
    cwd: target,
    stdio: ["pipe", "pipe", "inherit"],
    reject: false,
  });

  await wait(serve);

  const dev = execa("yarn", ["dev"], {
    cwd: target,
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

run().catch(console.error);
