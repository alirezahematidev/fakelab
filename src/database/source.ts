import type { FakerLocale } from "../constants";
import { BaseSourceConfig } from "../source";
import type { DatabaseOptions } from "../types";
import { DATABASE_SOURCE } from "./template";

export class DatabaseSource extends BaseSourceConfig {
  private readonly SOURCE_FILENAME = "database.js";

  constructor(
    protected readonly dirname: string,
    protected readonly PORT: number,
    protected readonly PREFIX: string,
    protected readonly LOCALE: FakerLocale,
    protected readonly options: DatabaseOptions
  ) {
    super(dirname, { PORT, PREFIX, LOCALE, ENABLED: options.enabled });
  }

  override prepare() {
    return super.prepare(DATABASE_SOURCE, this.SOURCE_FILENAME);
  }
}
