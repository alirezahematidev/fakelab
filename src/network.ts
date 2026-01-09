import type { Config } from "./config/config";
import type { NetworkOptions } from "./types";
import { Logger } from "./logger";

export class Network {
  private readonly options: NetworkOptions;

  private constructor(private readonly config: Config) {
    this.options = this.config.options.network();

    this.timeout = this.timeout.bind(this);
    this.error = this.error.bind(this);
    this.state = this.state.bind(this);
    this.wait = this.wait.bind(this);
    this.offline = this.offline.bind(this);
  }

  static initHandlers(config: Config) {
    return new Network(config);
  }

  timeout() {
    const occured = this.chance(this.options.timeoutRate);
    if (occured) Logger.debug("Network timeout...");

    return occured;
  }

  error() {
    const occured = this.chance(this.options.errorRate);
    if (occured) Logger.debug("Network error...");

    return occured;
  }

  state(state: "error" | "offline") {
    switch (state) {
      case "error": {
        const codes = this.options.errors?.statusCodes || [];
        const status = codes.length > 0 ? codes[Math.floor(Math.random() * codes.length)] : 500;

        const message = this.options.errors?.messages?.[status] ?? "Network error";

        return { status, message };
      }
      case "offline": {
        return { status: 503, message: "Network offline" };
      }
      default: {
        return { status: 500, message: "Server unknown error" };
      }
    }
  }

  async wait() {
    const delay = this.resolveDelay();

    if (delay > 0) {
      Logger.debug("Network waiting (%d ms)...", delay);
      await this.sleep(delay);
    }
  }

  offline() {
    return this.options.offline ?? false;
  }

  private resolveDelay(): number {
    const d = this.options.delay;

    if (typeof d === "number") return Math.round(d);

    if (Array.isArray(d)) return this.random(d);

    return 0;
  }

  private chance(rate = 0): boolean {
    return Math.random() < rate;
  }

  private random([min, max]: [number, number]): number {
    return Math.round(Math.random() * (max - min) + min);
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
