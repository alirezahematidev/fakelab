import path from "node:path";
import fs from "fs-extra";
import { JSONFilePreset } from "lowdb/node";
import { type InterfaceDeclaration, type TypeAliasDeclaration, Project } from "ts-morph";
import { CWD, DIRNAME } from "./file";
import type { Entity, UserConfig } from "./types";
import { Database } from "./database";
import { HEADLESS_DTS_SOURCE } from "./headless/template";

type ParserTypeDeclaration = InterfaceDeclaration | TypeAliasDeclaration;

class ParserEngine {
  private __targets: ParserTypeDeclaration[];

  private constructor(private readonly files: string[], private readonly tsConfigFilePath: string, private readonly headless = false) {
    const project = new Project({ tsConfigFilePath: this.tsConfigFilePath });

    const sources = project.addSourceFilesAtPaths(this.files);

    this.__targets = sources.flatMap((source) => {
      const interfaces = source.getInterfaces();
      const typeAliases = source.getTypeAliases();
      const exportDeclarations = source.getExportDeclarations().flatMap((dec) => dec.getNamedExports().flatMap((n) => n.getLocalTargetDeclarations()));

      return [...interfaces, ...typeAliases, ...(exportDeclarations as ParserTypeDeclaration[])];
    });

    this.generateTypeUtils();
  }

  static async init(files: string[], tsConfigFilePath: string, headless = false) {
    const instance = new ParserEngine(files, tsConfigFilePath, headless);

    await instance.generateInFileEntitiyMap();

    return instance;
  }

  private normalizePath(p: string) {
    return p.split(path.sep).join(path.posix.sep);
  }

  private address(directoryPath: string, basename: string) {
    const cwd = this.normalizePath(CWD);

    const directory = directoryPath.replace(cwd, "");

    const result = `${directory}/${basename}`;

    return result;
  }

  private getDeclarationsMap() {
    return [
      ...new Set(
        this.__targets.map((target) => {
          const name = target.getName();
          const filepath = target.getSourceFile().getFilePath();

          return `${name.toLowerCase()}: import("${filepath}").${name}`;
        })
      ),
    ];
  }

  private generateTypeUtils() {
    const decl = this.getDeclarationsMap();

    if (decl.length === 0) return;

    const raw = `\ninterface $$ {\n${decl.join("\n")}\n}`;

    fs.appendFile(path.resolve(DIRNAME, "type-utils.d.ts"), raw);
  }

  async generateInFileEntitiyMap() {
    if (this.headless) {
      await fs.writeFile(path.resolve(DIRNAME, "runtime.d.ts"), HEADLESS_DTS_SOURCE);
    }

    const decl = this.getDeclarationsMap();

    if (decl.length === 0) return;

    const data = `\ninterface Runtime$ {\n${decl.join("\n")}\n}`;

    await fs.appendFile(path.resolve(DIRNAME, "runtime.d.ts"), data);
  }

  public async entities() {
    const mapping = (await Promise.all(
      this.__targets.map(async (face) => {
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

    let seed = fakerOptions.seed;

    if (seed != null && "seed" in faker) {
      if (Array.isArray(seed)) {
        seed = [...new Set(seed)];
      }

      faker.seed(seed);
    }

    return faker;
  }
}

export { ParserEngine };
