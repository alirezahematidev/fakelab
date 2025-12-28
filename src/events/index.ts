import mitt from "mitt";
import type { EmitterEventMap, Handler, SnapshotEmitter, ServerEmitter, SnapshotEvent, TriggerEvent, ServerEvent } from "./types";
import { Logger } from "../logger";
import type { Hook } from "../types";

import { ServerEventSubscriber, SnapshotEventSubscriber } from "./subscribers";

type EventSubscriberPayload = {
  hooks?: Hook[];
};

export class EventSubscriber {
  private $emitter = mitt<EmitterEventMap>();

  private _snapshotEventSubscriber: SnapshotEventSubscriber;
  private _serverEventSubscriber: ServerEventSubscriber;

  constructor(private readonly payload?: EventSubscriberPayload) {
    this._snapshotEventSubscriber = new SnapshotEventSubscriber(this.$emitter as unknown as SnapshotEmitter, this.payload?.hooks || []);
    this._serverEventSubscriber = new ServerEventSubscriber(this.$emitter as unknown as ServerEmitter);

    this.dispose();
  }

  get snapshot() {
    return this._snapshotEventSubscriber;
  }

  get server() {
    return this._serverEventSubscriber;
  }

  subscribe(name: string, event: TriggerEvent, handler: Handler<unknown>) {
    if (this.isServerEvent(event)) {
      return this._serverEventSubscriber.subscribe(name, event, handler);
    }

    if (this.isSnapshotEvent(event)) {
      return this._snapshotEventSubscriber.subscribe(name, event, handler);
    }

    Logger.warn("Webhook hook %s skipped (disabled or invalid).", Logger.blue(name));
    return () => {};
  }

  clear() {
    this.$emitter.all.clear();
  }

  private isServerEvent(event: TriggerEvent): event is ServerEvent {
    return event.startsWith("server");
  }

  private isSnapshotEvent(event: TriggerEvent): event is SnapshotEvent {
    return event.startsWith("snapshot");
  }

  private dispose() {
    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
      process.on(signal, () => {
        this.clear();
        process.exit(0);
      })
    );
  }
}
