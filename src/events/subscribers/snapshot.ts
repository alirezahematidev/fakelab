import { Logger } from "../../logger";
import type { Hook } from "../../types";
import type { Handler, SnapshotEmitter, SnapshotEvent, SnapshotEventArgs, TriggerEvent } from "../types";

export class SnapshotEventSubscriber {
  constructor(private $emitter: SnapshotEmitter, private readonly hooks: Hook[]) {
    this.captured = this.captured.bind(this);
    this.refreshed = this.refreshed.bind(this);
    this.deleted = this.deleted.bind(this);
    this.subscribe = this.subscribe.bind(this);

    this.$emitter.all.clear();
  }

  public captured(args: SnapshotEventArgs) {
    const hook = this.getTriggeredHook("snapshot:captured");

    if (hook) {
      Logger.info("Dispatching %s for event %s.", Logger.blue(hook.name), Logger.blue("snapshot:captured"));
      this.$emitter.emit("snapshot:captured", args);
    } else {
      Logger.warn(`Webhook skipped: missing trigger event %s.`, Logger.blue("snapshot:captured"));
    }
  }

  public refreshed(args: SnapshotEventArgs) {
    const hook = this.getTriggeredHook("snapshot:refreshed");

    if (hook) {
      Logger.info("Dispatching %s for event %s.", Logger.blue(hook.name), Logger.blue("snapshot:refreshed"));
      this.$emitter.emit("snapshot:refreshed", args);
    } else {
      Logger.warn(`Webhook skipped: missing trigger event %s.`, Logger.blue("snapshot:refreshed"));
    }
  }

  public deleted(args: SnapshotEventArgs) {
    const hook = this.getTriggeredHook("snapshot:deleted");

    if (hook) {
      Logger.info("Dispatching %s for event %s.", Logger.blue(hook.name), Logger.blue("snapshot:deleted"));
      this.$emitter.emit("snapshot:deleted", args);
    } else {
      Logger.warn(`Webhook skipped: missing trigger event %s.`, Logger.blue("snapshot:deleted"));
    }
  }

  public subscribe(name: string, event: SnapshotEvent, handler: Handler<SnapshotEventArgs>) {
    this.$emitter.on(event, handler);

    return () => {
      Logger.info("Webhook %s unsubscribed.", Logger.blue(name));
      this.$emitter.off(event, handler);
    };
  }

  private getTriggeredHook(event: TriggerEvent) {
    return this.hooks.find((hook) => hook.trigger.event === event);
  }
}
