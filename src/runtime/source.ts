import type { FakerLocale } from "../constants";
import { BaseSourceConfig } from "../source";
import { RUNTIME_SOURCE } from "./template";

export class RuntimeSource extends BaseSourceConfig {
  private readonly SOURCE_FILENAME = "runtime.js";

  constructor(
    protected readonly dirname: string,
    protected readonly PORT: number,
    protected readonly PREFIX: string,
    protected readonly LOCALE: FakerLocale,
    protected readonly FAKELAB_ENABLED: boolean,
    protected readonly HEADLESS: boolean
  ) {
    super(dirname, { PORT, PREFIX, LOCALE, FAKELAB_ENABLED, HEADLESS });
  }

  override prepare() {
    return super.prepare(RUNTIME_SOURCE, this.SOURCE_FILENAME);
  }
}
