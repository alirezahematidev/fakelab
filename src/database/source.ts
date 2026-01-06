import { BaseSourceConfig } from "../source";
import { DATABASE_SOURCE } from "./template";

export class DatabaseSource extends BaseSourceConfig {
  private readonly SOURCE_FILENAME = "database.js";

  private constructor(protected readonly dirname: string, protected readonly port: number, protected readonly prefix: string, protected readonly enabled: boolean) {
    super(dirname, { PORT: port, PREFIX: prefix, ENABLED: enabled });
  }

  static init(dirname: string, port: number, prefix: string, enabled: boolean) {
    return new DatabaseSource(dirname, port, prefix, enabled);
  }

  override prepare() {
    return super.prepare(DATABASE_SOURCE, this.SOURCE_FILENAME);
  }
}
