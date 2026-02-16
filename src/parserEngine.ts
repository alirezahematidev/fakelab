import path from "node:path";
import fs from "fs-extra";
import { JSONFilePreset } from "lowdb/node";
import { type InterfaceDeclaration, type TypeAliasDeclaration, Node, Project, SourceFile, Type } from "ts-morph";

import type { Entity, RuntimeOptions, UserConfig } from "./types";
import { Database } from "./database";
import { HEADLESS_DTS_SOURCE } from "./headless/template";
import { Logger } from "./logger";
import type { FakerLocale } from "./constants";
import { fileURLToPath } from "node:url";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

type ParserTypeDeclaration = InterfaceDeclaration | TypeAliasDeclaration;

class ParserEngine {
  private _targets: ParserTypeDeclaration[];

  private readonly _scopes = ["runtime", "database"];

  private constructor(private readonly files: string[], private readonly tsConfigFilePath: string, private readonly runtimeOptions: RuntimeOptions) {
    const project = new Project({ tsConfigFilePath: this.tsConfigFilePath });
    const sources = project.addSourceFilesAtPaths(this.files);

    this.log(sources);

    this._targets = sources.flatMap((source) => {
      const interfaces = source.getInterfaces();
      const typeAliases = source.getTypeAliases();
      const exportDeclarations = source.getExportDeclarations().flatMap((dec) => dec.getNamedExports().flatMap((n) => n.getLocalTargetDeclarations()));

      return [...interfaces, ...typeAliases, ...(exportDeclarations as ParserTypeDeclaration[])];
    });
  }

  static async init(files: string[], tsConfigFilePath: string, locale: FakerLocale, runtimeOptions: RuntimeOptions) {
    const instance = new ParserEngine(files, tsConfigFilePath, runtimeOptions);

    await instance.generateTypeDefinitions(locale);

    return instance;
  }

  private log(sources: SourceFile[]) {
    const loadedFiles = sources.map((source) => source.getFilePath());

    loadedFiles.forEach((file) => {
      Logger.dim("Loaded file %s", file);
    });
  }

  private normalizePath(p: string) {
    return p.split(path.sep).join(path.posix.sep);
  }

  private address(directoryPath: string, basename: string) {
    const cwd = this.normalizePath(process.cwd());

    const directory = directoryPath.replace(cwd, "");

    const result = `${directory}/${basename}`;

    return result;
  }

  private getDeclarationTextFromType(type: Type): string | null {
    const sym = type.getSymbol() ?? type.getAliasSymbol();

    if (!sym) return null;

    const declarations = sym.getDeclarations();

    const isInterface = declarations.find(Node.isInterfaceDeclaration);
    const isType = declarations.find(Node.isTypeAliasDeclaration);
    const isExport = declarations.find(Node.isExportDeclaration);

    const decl = isInterface ?? isType ?? isExport;

    if (!decl) return null;

    return decl.getText().replace(/export|interface|type|;|\s+/g, "");
  }

  private getDeclarationsMap() {
    return [
      ...new Set(
        this._targets.map((target) => {
          const name = target.getName();
          const filepath = target.getSourceFile().getFilePath();

          return `${name.toLowerCase()}: import("${filepath}").${name}`;
        })
      ),
    ];
  }

  private argsToString<T extends Record<string, unknown>>(obj: T) {
    const entries = Object.entries(obj ?? {}).filter(([, v]) => v != null);

    if (entries.length === 0) return null;

    return entries.map((entry) => entry.join("_")).join("_");
  }

  async typeToString(type: Type, args: Record<string, unknown>) {
    const truthyArgs = this.argsToString(args);

    let key = this.getDeclarationTextFromType(type);

    if (truthyArgs) key += `(${truthyArgs})`;

    return key;
  }

  async generateTypeDefinitions(locale: FakerLocale) {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") return;

    try {
      await Promise.all(
        this._scopes.map(async (scope) => {
          const target = path.resolve(DIRNAME, scope + ".d.ts");
          const temp = path.resolve(DIRNAME, scope + ".snap");

          if (this.runtimeOptions.headless && scope === "runtime") {
            const switchable = this.runtimeOptions.switchable;

            const content = HEADLESS_DTS_SOURCE.replace(/SWITCHABLE/g, switchable ? "true" : "false");

            await fs.writeFile(target, content);
          }

          const declarations = this.getDeclarationsMap();

          if (declarations.length === 0) return;

          const data = `\ninterface Runtime$ {\n${declarations.join("\n")}\n}\ninterface Locale$ {\n__locale:"${locale}"\n}`;
          if (await fs.exists(temp)) {
            const content = await fs.readFile(temp, "utf8");
            fs.writeFile(target, content + data);
          } else {
            await fs.copy(target, temp, { dereference: true });
            fs.appendFile(target, data);
          }
        })
      );
    } catch {
      //
    }
  }

  public async entities() {
    const mapping = (await Promise.all(
      this._targets.map(async (face) => {
        const name = face.getName().toLowerCase();
        const type = face.getType();
        const directoryPath = this.normalizePath(face.getSourceFile().getDirectoryPath());
        const basename = face.getSourceFile().getBaseName();

        const filepath = this.address(directoryPath, basename);

        const tablePath = path.resolve(Database.DATABASE_DIR, `${name}.json`);

        const redactedTablePath = this.address(this.normalizePath(Database.DATABASE_DIR), path.basename(tablePath));

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
