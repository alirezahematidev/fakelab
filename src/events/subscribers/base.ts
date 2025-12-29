import type { Emitter, Handler } from "mitt";
import { Logger } from "../../logger";

export class BaseSubscriber<Event extends string, Arg> {
  constructor(protected readonly $emitter: Emitter<Record<Event, Arg>>) {
    this.subscribe = this.subscribe.bind(this);
  }

  public subscribe(name: string, event: Event, handler: Handler<Arg>) {
    this.$emitter.on(event, handler);

    return () => {
      Logger.info("Webhook %s unsubscribed.", Logger.blue(name));
      this.$emitter.off(event, handler);
    };
  }

  public clear() {
    this.$emitter.all.clear();
  }
}
