import type { Config } from "./config/config";
import type { BaseSubscriber } from "./events/subscribers/base";
import type { TriggerEvent } from "./events/types";
import { Logger } from "./logger";
import type { Hook, HookValidationResult, HttpHeaders, Unsub, WebhookOptions } from "./types";

export class Webhook<E extends string, Arg> {
  private options: WebhookOptions;
  private unsubs: Set<Unsub> = new Set();

  private history: Set<string> = new Set();

  private activated: boolean = false;

  private static processHandlersRegistered = false;

  constructor(private readonly subscriber: BaseSubscriber<E, Arg>, private readonly config: Config) {
    this.options = this.config.options.webhook();

    this.dispose();
  }

  isActivated() {
    return this.activated;
  }

  activate() {
    this.flush("REACTIVATE");

    if (!this.options.enabled) {
      Logger.warn("Webhook is disabled. Skipping activation.");
      return;
    }

    if (this.options.hooks.length === 0) {
      Logger.warn("Webhook enabled but no hooks configured. Skipping activation.");
      return;
    }

    this.activated = true;

    for (const hook of this.options.hooks) {
      const { error, message, args = [] } = this.validateHook(hook);
      if (error) {
        Logger.error(message, ...args);
        continue;
      }

      if (this.history.has(hook.name)) continue;

      const subscriptionController = new AbortController();

      const unsubscribe = this.subscriber.subscribe(hook.name, hook.trigger.event as E, (data) => this.handle(hook, data, subscriptionController.signal));
      this.history.add(hook.name);

      this.unsubs.add((reason) => {
        try {
          unsubscribe();
        } finally {
          this.history.delete(hook.name);
          subscriptionController.abort(reason);
        }
      });
    }
  }

  private flush(reason?: string) {
    this.subscriber.clear();

    for (const unsub of this.unsubs) unsub(reason);
    this.unsubs.clear();
  }

  private async handle<T>({ name, method, url, headers, transform, trigger }: Hook, data: T, signal: AbortSignal) {
    let payload: T = data;

    try {
      payload = typeof transform === "function" ? (transform(data) as T) : data;
    } catch (error) {
      Logger.error(`Webhook %s payload transformation failed. error: %s`, Logger.blue(name), error);
    }

    if (signal.aborted) {
      Logger.error(`Webhook %s aborted`, Logger.blue(name));
    } else {
      signal.addEventListener("abort", () => {
        Logger.error(`Webhook %s aborted`, Logger.blue(name));
      });
    }

    try {
      Logger.info(`Delivering %s to %s`, Logger.blue(name), Logger.blue(url));

      const response = await fetch(url, { method, body: JSON.stringify(payload), signal, headers: this.requestHeaders(name, trigger.event, headers) });

      if (response.ok) {
        Logger.success(`Webhook %s delivered successfully.`, Logger.blue(name));
      } else {
        Logger.error(`Webhook %s request failed.`, Logger.blue(name));
      }
    } catch (error) {
      Logger.error(`Webhook %s network error: %s`, Logger.blue(name), error);
    }
  }

  private validateHook(hook: Hook): HookValidationResult {
    if (hook.method.toUpperCase() !== "POST") {
      return { error: true, message: "Webhook hook method must be 'POST'. received %s", args: [hook.method] };
    }

    try {
      const u = new URL(hook.url);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { error: true, message: `Webhook hook URL must use http/https. Received "%s".`, args: [u.protocol] };
      }
    } catch (error) {
      return { error: true, message: `Webhook hook URL is invalid. Received: %s. error: %s`, args: [hook.url, JSON.stringify(error)] };
    }

    return { error: false, message: null };
  }

  private requestHeaders(name: string, event: TriggerEvent, init?: HttpHeaders) {
    const headers = new Headers(init);

    headers.append("Content-Type", "application/json");

    headers.append("X-Fakelab-Webhook", `name=${name},event=${event}`);

    return headers;
  }

  private dispose() {
    if (Webhook.processHandlersRegistered) return;
    Webhook.processHandlersRegistered = true;

    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
      process.on(signal, () => {
        this.activated = false;

        this.history.clear();

        this.flush(signal);

        process.exit(0);
      })
    );
  }
}
