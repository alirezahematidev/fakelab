import path from "node:path";
import fs from "fs-extra";
import { JSONFilePreset } from "lowdb/node";
import { type InterfaceDeclaration, type TypeAliasDeclaration, Project } from "ts-morph";
import { CWD, DIRNAME } from "./file";
import type { Entity, UserConfig } from "./types";
import type { Database } from "./database";

type ParserTypeDeclaration = InterfaceDeclaration | TypeAliasDeclaration;

class ParserEngine {
  private __targets: ParserTypeDeclaration[];

  constructor(private readonly files: string[], private readonly database: Database) {
    const project = new Project({ tsConfigFilePath: "tsconfig.json" });

    const sources = project.addSourceFilesAtPaths(this.files);

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

  public sync() {
    const declarations = [
      ...new Set(
        this.__targets.map((target) => {
          const name = target.getName();
          const filepath = target.getSourceFile().getFilePath();

          return `${name.toLowerCase()}: import("${filepath}").${name}`;
        })
      ),
    ];
    const raw2 = `\ninterface Offline$ {\n${declarations.join("\n")}\n}`;

    fs.appendFile(path.resolve(DIRNAME, "offline.d.ts"), raw2);
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
    const raw = `\ninterface Runtime$ {\n${declarations.join("\n")}\n}`;

    fs.appendFile(path.resolve(DIRNAME, "runtime.d.ts"), raw);
  }

  private address(directoryPath: string, basename: string) {
    const cwd = this.normalizePath(CWD);

    const directory = directoryPath.replace(cwd, "");

    const result = `${directory}/${basename}`;

    return result;
  }

  public async entities() {
    const mapping = (await Promise.all(
      this.__targets.map(async (face) => {
        const name = face.getName().toLowerCase();
        const type = face.getType();
        const directoryPath = this.normalizePath(face.getSourceFile().getDirectoryPath());
        const basename = face.getSourceFile().getBaseName();

        const filepath = this.address(directoryPath, basename);

        const tablePath = path.resolve(this.database.DATABASE_DIR, `${name}.json`);

        const redactedTablePath = this.address(this.normalizePath(this.database.DATABASE_DIR), path.basename(tablePath));

        const snapshot = directoryPath.includes("/.fakelab/snapshots");

        const table = await JSONFilePreset<unknown[]>(tablePath, []);

        return [name, { type, filepath, snapshot, table, tablepath: redactedTablePath }];
      })
    )) as Array<[string, Entity]>;

    return new Map(mapping.sort((a, b) => Number(a[1].snapshot) - Number(b[1].snapshot)));
  }

  public async initFakerLibrary(fakerOptions: UserConfig["fakerOptions"]): Promise<import("@faker-js/faker").Faker> {
    const { faker } = await import(`@faker-js/faker/locale/${fakerOptions.locale}`);

    return faker;
  }
}

export { ParserEngine };
