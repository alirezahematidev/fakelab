import mitt from "mitt";
import type { EmitterEventMap, Handler, SnapshotEmitter, SnapshotEvent, TriggerEvent } from "./types";
import { SnapshotEventSubscriber } from "./subscribers";
import { Logger } from "../logger";
import type { Hook } from "../types";

export class EventSubscriber {
  private $emitter = mitt<EmitterEventMap>();

  private _snapshotEventSubscriber: SnapshotEventSubscriber;

  constructor(private readonly hooks: Hook[]) {
    this._snapshotEventSubscriber = new SnapshotEventSubscriber(this.$emitter as SnapshotEmitter, this.hooks);

    this.dispose();
  }

  get snapshot() {
    return this._snapshotEventSubscriber;
  }

  subscribe(name: string, event: TriggerEvent, handler: Handler<any>) {
    if (this.isSnapshotEvent(event)) {
      return this._snapshotEventSubscriber.subscribe(name, event, handler);
    }

    Logger.warn("Webhook hook %s skipped (disabled or invalid).", Logger.blue(name));
    return () => {};
  }

  clear() {
    this.$emitter.all.clear();
  }

  private isSnapshotEvent(event: TriggerEvent): event is SnapshotEvent {
    return event.startsWith("snapshot");
  }

  private dispose() {
    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
      process.on(signal, () => {
        this.clear();
      })
    );
  }
}
