import { InterfaceDeclaration, Project, type Type } from "ts-morph";
import type { UserConfig } from "./config";
import path from "node:path";

class ParserEngine {
  private __targets: InterfaceDeclaration[];

  constructor(readonly files: string[]) {
    const project = new Project({ tsConfigFilePath: "tsconfig.json" });
    const sources = project.addSourceFilesAtPaths(files);

    this.__targets = sources.flatMap((source) => source.getInterfaces());
  }

  async run(factory: () => Promise<unknown>) {
    return await factory();
  }

  private normalizePath(p: string) {
    return p.split(path.sep).join(path.posix.sep);
  }

  public entities() {
    const mapping = this.__targets.map((face) => {
      const name = face.getName().toLowerCase();
      const type = face.getType();
      const cwd = this.normalizePath(process.cwd());
      const directoryPath = this.normalizePath(face.getSourceFile().getDirectoryPath());

      const directory = directoryPath.replace(cwd, "");
      const baseName = face.getSourceFile().getBaseName();
      const filepath = `${directory}/${baseName}`;

      return [name, { type, filepath }];
    }) as Array<[string, { type: Type; filepath: string }]>;

    return new Map(mapping);
  }

  public async loadFaker(fakerOptions: UserConfig["fakerOptions"], locale?: string): Promise<import("@faker-js/faker").Faker> {
    const { faker } = await import(`@faker-js/faker/locale/${locale || fakerOptions.locale}`);

    return faker;
  }
}

export { ParserEngine };
