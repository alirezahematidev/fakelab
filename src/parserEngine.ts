import path from "node:path";
import fs from "fs-extra";
import { type InterfaceDeclaration, type TypeAliasDeclaration, Project, type Type } from "ts-morph";
import type { UserConfig } from "./config";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ParserTypeDeclaration = InterfaceDeclaration | TypeAliasDeclaration;

class ParserEngine {
  private __targets: ParserTypeDeclaration[];

  constructor(readonly files: string[]) {
    const project = new Project({ tsConfigFilePath: "tsconfig.json" });
    const sources = project.addSourceFilesAtPaths(files);
    this.__targets = sources.flatMap((source) => {
      // interfaces
      const interfaces = source.getInterfaces();

      // types
      const typeAliases = source.getTypeAliases();

      // export declarations
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

    const raw = `declare global {\ninterface FakeRuntime {${declarations.join("\n")}\n}\n}`;
    fs.appendFile(path.resolve(__dirname, "runtime.d.ts"), raw);
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

  public async loadFaker(fakerOptions: UserConfig["fakerOptions"]): Promise<import("@faker-js/faker").Faker> {
    const { faker } = await import(`@faker-js/faker/locale/${fakerOptions.locale}`);

    return faker;
  }
}

export { ParserEngine };
