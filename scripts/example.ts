import glob from "fast-glob";
import path from "node:path";
import fs from "fs-extra";
import { execa } from "execa";
import { select } from "@inquirer/prompts";
import { Project, Runner } from "./runner";

async function run() {
  const choices = (await glob("./*", { onlyDirectories: true, cwd: Runner.EXAMPLES_PATH })) as Project[];

  const project = await select<Project>({ message: "Select a example project", choices });

  const projectDir = path.resolve(Runner.EXAMPLES_PATH, project);

  await execa("yarn", ["link"], {
    cwd: process.cwd(),
  });

  await execa("yarn", ["build"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (!fs.existsSync(path.join(projectDir, "node_modules/fakelab"))) {
    await execa("yarn", ["link", "fakelab"], {
      cwd: projectDir,
      stdio: "inherit",
    });
  }

  await execa("yarn", ["install", "--check-files"], {
    cwd: projectDir,
    stdio: "inherit",
  });

  Runner.start(project);
}

run().catch(console.error);
