import { BaseSourceConfig } from "../source";
import { RUNTIME_SOURCE } from "./template";

export class RuntimeSource extends BaseSourceConfig {
  private readonly SOURCE_FILENAME = "runtime.js";

  private constructor(protected readonly dirname: string, protected readonly port: number, protected readonly prefix: string, protected readonly enabled: boolean) {
    super(dirname, { PORT: port, PREFIX: prefix, FAKELAB_ENABLED: enabled });
  }

  static init(dirname: string, port: number, prefix: string, enabled: boolean) {
    return new RuntimeSource(dirname, port, prefix, enabled);
  }

  override prepare() {
    return super.prepare(RUNTIME_SOURCE, this.SOURCE_FILENAME);
  }
}
