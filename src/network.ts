import express from "express";
import type { Config } from "./config/conf";
import type { NetworkOptions } from "./types";
import { Logger } from "./logger";

export class Network {
  private readonly options: NetworkOptions;

  private constructor(private readonly config: Config) {
    this.options = this.config.options.network();

    this.timeout = this.timeout.bind(this);
    this.error = this.error.bind(this);
    this.state = this.state.bind(this);
    this.middleware = this.middleware.bind(this);
    this.wait = this.wait.bind(this);
    this.offline = this.offline.bind(this);
  }

  static initHandlers(config: Config) {
    return new Network(config);
  }

  timeout() {
    const occured = this.chance(this.options?.timeoutRate);
    if (occured) Logger.debug("Network timeout...");

    return occured;
  }

  error() {
    const occured = this.chance(this.options?.errorRate);
    if (occured) Logger.debug("Network error...");

    return occured;
  }

  state(state: "error" | "offline") {
    switch (state) {
      case "error":
        return { status: 500, message: "Network error" };
      case "offline":
        return { status: 503, message: "Network offline" };
      default:
        return { status: 500, message: "Unknown error" };
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
    return this.options?.offline ?? false;
  }

  middleware(_: express.Request, res: express.Response, next: express.NextFunction) {
    const error = this.options?.errorRate || 0;
    const timeout = this.options?.timeoutRate || 0;
    const offline = this.options?.offline ?? false;

    const value = `delay=${this.resolveDelay()},error=${error},timeout=${timeout},offline=${offline}`;

    res.setHeader("X-Fakelab-Network", value);
    next();
  }

  private resolveDelay(): number {
    const d = this.options?.delay;

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
