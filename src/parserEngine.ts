import { InterfaceDeclaration, Project } from "ts-morph";
import type { UserConfig } from "./config";

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

  public entities() {
    return new Map(this.__targets.map((face) => [face.getName().toLowerCase(), face.getType()]));
  }

  public async loadFaker(fakerOptions: UserConfig["fakerOptions"]): Promise<import("@faker-js/faker").Faker> {
    const { faker } = await import(`@faker-js/faker/locale/${fakerOptions.locale}`);

    return faker;
  }
}

export { ParserEngine };
