import mitt from "mitt";
import { Logger } from "../../logger";
import type { Hook } from "../../types";
import type { SnapshotEvent, SnapshotEventArgs, TriggerEvent } from "../types";
import { BaseSubscriber } from "./base";

export class SnapshotEventSubscriber extends BaseSubscriber<SnapshotEvent, SnapshotEventArgs> {
  constructor(private readonly hooks: Hook[]) {
    const $emitter = mitt<Record<SnapshotEvent, SnapshotEventArgs>>();

    super($emitter);

    this.captured = this.captured.bind(this);
    this.refreshed = this.refreshed.bind(this);
    this.deleted = this.deleted.bind(this);

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

  private getTriggeredHook(event: TriggerEvent) {
    return this.hooks.find((hook) => hook.trigger.event === event);
  }
}
