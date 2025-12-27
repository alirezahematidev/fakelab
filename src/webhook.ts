import type { Config } from "./config/conf";
import type { EventSubscriber } from "./events";
import { Logger } from "./logger";
import type { Hook, WebhookOptions } from "./types";

export class Webhook {
  private options: WebhookOptions;
  private unsubs: Set<(reason: string) => void> = new Set();

  private _isDeactivated: boolean = false;

  constructor(private readonly subscriber: EventSubscriber, private readonly config: Config) {
    this.options = this.config.options.webhook();

    this.dispose();
  }

  activate() {
    if (this._isDeactivated) return;

    if (this.options.enabled && this.options.hooks.length > 0) {
      this.options.hooks.forEach((hook) => {
        const controller = new AbortController();

        const unsubscribe = this.subscriber.subscribe(hook.trigger.event, (data) => this.handle(hook, data, controller.signal));

        this.unsubs.add((reason) => {
          unsubscribe();
          controller.abort(reason);
        });
      });
    }
  }

  deactivate() {
    this.clear("DEACTIVATED");

    this._isDeactivated = true;
  }

  private clear(reason: string) {
    for (const unsubscribe of this.unsubs) {
      unsubscribe(reason);
    }
    this.unsubs.clear();
  }

  private async handle<T>({ method, url, headers, transform }: Hook, data: T, signal: AbortSignal) {
    const payload = typeof transform === "function" ? transform(data) : data;

    if (method !== "POST") {
      Logger.error("Only POST method is allowed to use. received %s", method);
      process.exit(1);
    }

    await fetch(url, { method, body: JSON.stringify(payload), signal, headers: { ...headers, "Content-Type": "application/json" } });
  }

  private dispose() {
    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
      process.on(signal, () => {
        this.clear(signal);
      })
    );
  }
}
