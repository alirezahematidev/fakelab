import path from "node:path";
import fs from "fs-extra";
import { type InterfaceDeclaration, type TypeAliasDeclaration, Project, type Type } from "ts-morph";
import type { UserConfig } from "./config";
import { fileURLToPath } from "node:url";

type ParserTypeDeclaration = InterfaceDeclaration | TypeAliasDeclaration;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    this.declareInFileMapping(this.__targets);
  }

  async run(factory: () => Promise<unknown>) {
    return await factory();
  }

  private normalizePath(p: string) {
    return p.split(path.sep).join(path.posix.sep);
  }

  private async declareInFileMapping(targets: ParserTypeDeclaration[]) {
    if (targets.length === 0) return;
    const names = [...new Set(targets.map((item) => `"${item.getName()}"`))];
    const declarations = [
      ...new Set(
        targets.map((item) => {
          const name = item.getName();
          const filepath = item.getSourceFile().getFilePath();

          return `${name}: import("${filepath}").${name}`;
        })
      ),
    ];

    const raw = `export declare type TName = ${names.join("|")};\nexport declare interface Fakelab {\n${declarations.join(";\n")}}`;

    fs.writeFile(path.resolve(__dirname, "./.fake/__typing.ts"), raw);
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
