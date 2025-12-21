import path from "node:path";
import fs from "fs-extra";
import { JSONFilePreset } from "lowdb/node";
import { type InterfaceDeclaration, type TypeAliasDeclaration, Project } from "ts-morph";
import type { UserConfig } from "./config";
import type { Config } from "./config/conf";
import { CWD, DIRNAME } from "./file";
import type { Entity } from "./types";

type ParserTypeDeclaration = InterfaceDeclaration | TypeAliasDeclaration;

class ParserEngine {
  private __targets: ParserTypeDeclaration[];

  constructor(readonly files: string[], private readonly config: Config) {
    const project = new Project({ tsConfigFilePath: "tsconfig.json" });

    const sources = project.addSourceFilesAtPaths(files);

    this.__targets = sources.flatMap((source) => {
      const interfaces = source.getInterfaces();
      const typeAliases = source.getTypeAliases();
      const exportDeclarations = source.getExportDeclarations().flatMap((dec) => dec.getNamedExports().flatMap((n) => n.getLocalTargetDeclarations()));

      return [...interfaces, ...typeAliases, ...(exportDeclarations as ParserTypeDeclaration[])];
    });

    this.generateInFileEntitiyMap(this.__targets);
  }

  async run(factory: () => Promise<unknown>) {
    return await factory();
  }

  private normalizePath(p: string) {
    return p.split(path.sep).join(path.posix.sep);
  }

  private generateInFileEntitiyMap(targets: ParserTypeDeclaration[]) {
    const declarations = [
      ...new Set(
        targets.map((target) => {
          const name = target.getName();
          const filepath = target.getSourceFile().getFilePath();

          return `${name}: import("${filepath}").${name}`;
        })
      ),
    ];

    const { expose } = this.config.browserOpts();

    let raw = `\ninterface Runtime$ {\n${declarations.join("\n")}\n}`;

    if (expose.mode === "global") {
      raw = `\ndeclare global {${raw}\n}`;
    }

    fs.appendFile(path.resolve(DIRNAME, this.config.RUNTIME_DECL_FILENAME), raw);
  }

  private address(directoryPath: string, basename: string) {
    const cwd = this.normalizePath(CWD);

    const directory = directoryPath.replace(cwd, "");

    return `${directory}/${basename}`;
  }

  public async entities() {
    const mapping = (await Promise.all(
      this.__targets.map(async (face) => {
        const name = face.getName().toLowerCase();
        const type = face.getType();
        const directoryPath = this.normalizePath(face.getSourceFile().getDirectoryPath());
        const basename = face.getSourceFile().getBaseName();

        const filepath = this.address(directoryPath, basename);

        const dbPath = this.config.database.directoryPath();

        const tablePath = path.resolve(dbPath, `${name}.json`);

        const redactedTablePath = this.address(this.normalizePath(dbPath), path.basename(tablePath));

        const table = await JSONFilePreset<unknown[]>(tablePath, []);

        return [name, { type, filepath, table, tablepath: redactedTablePath }];
      })
    )) as Array<[string, Entity]>;

    return new Map(mapping);
  }

  public async initFakerLibrary(fakerOptions: UserConfig["fakerOptions"]): Promise<import("@faker-js/faker").Faker> {
    const { faker } = await import(`@faker-js/faker/locale/${fakerOptions.locale}`);

    return faker;
  }
}

export { ParserEngine };
