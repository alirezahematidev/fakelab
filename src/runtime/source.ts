import { BaseSourceConfig } from "../source";
import { RUNTIME_SOURCE } from "./template";

export class RuntimeSource extends BaseSourceConfig {
  private readonly SOURCE_FILENAME = "runtime.js";

  private constructor(protected readonly dirname: string, protected readonly port: number, protected readonly prefix: string) {
    super(dirname, { PORT: port, PREFIX: prefix });
  }

  static init(dirname: string, port: number, prefix: string) {
    return new RuntimeSource(dirname, port, prefix);
  }

  override prepare() {
    return super.prepare(RUNTIME_SOURCE, this.SOURCE_FILENAME);
  }
}
