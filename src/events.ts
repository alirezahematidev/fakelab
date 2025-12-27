import mitt, { type Emitter, type Handler } from "mitt";
import type { TriggerEvent, SnapshotEvent, SnapshotEventPayload, DatabaseEvent, DatabaseEventPayload } from "./types";

type EventMap<T extends TriggerEvent, P = unknown> = Record<T, P>;
type SnapshotEmitter = Emitter<EventMap<SnapshotEvent, SnapshotEventPayload>>;
type DatabaseEmitter = Emitter<EventMap<DatabaseEvent, DatabaseEventPayload>>;

export class SnapshotEventSubscriber {
  constructor(private $emitter: SnapshotEmitter) {
    this.captured = this.captured.bind(this);
    this.refreshed = this.refreshed.bind(this);
    this.deleted = this.deleted.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  public captured(payload: SnapshotEventPayload) {
    this.$emitter.emit("snapshot:captured", payload);
  }

  public refreshed(payload: SnapshotEventPayload) {
    this.$emitter.emit("snapshot:refreshed", payload);
  }

  public deleted(payload: SnapshotEventPayload) {
    this.$emitter.emit("snapshot:deleted", payload);
  }

  public subscribe(event: SnapshotEvent, handler: Handler<SnapshotEventPayload>) {
    this.$emitter.on(event, handler);

    return () => {
      this.$emitter.off(event, handler);
    };
  }
}

export class DatabaseEventSubscriber {
  constructor(private $emitter: DatabaseEmitter) {
    this.inserted = this.inserted.bind(this);
    this.flushed = this.flushed.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  public inserted(payload: DatabaseEventPayload) {
    this.$emitter.emit("database:inserted", payload);
  }

  public flushed(payload: DatabaseEventPayload) {
    this.$emitter.emit("database:flushed", payload);
  }

  public subscribe(event: DatabaseEvent, handler: Handler<DatabaseEventPayload>) {
    this.$emitter.on(event, handler);

    return () => {
      this.$emitter.off(event, handler);
    };
  }
}

export class EventSubscriber {
  private $emitter = mitt<EventMap<TriggerEvent>>();

  private _snapshotEventSubscriber: SnapshotEventSubscriber;
  private _databaseEventSubscriber: DatabaseEventSubscriber;

  constructor() {
    this._snapshotEventSubscriber = new SnapshotEventSubscriber(this.$emitter as SnapshotEmitter);
    this._databaseEventSubscriber = new DatabaseEventSubscriber(this.$emitter as DatabaseEmitter);

    this.dispose();
  }

  get snapshot() {
    return this._snapshotEventSubscriber;
  }

  get database() {
    return this._databaseEventSubscriber;
  }

  subscribe(event: TriggerEvent, handler: Handler<any>) {
    if (this.isSnapshotEvent(event)) {
      return this._snapshotEventSubscriber.subscribe(event, handler);
    }
    if (this.isDatabaseEvent(event)) {
      return this._databaseEventSubscriber.subscribe(event, handler);
    }

    return () => {};
  }

  clear() {
    this.$emitter.all.clear();
  }

  private isSnapshotEvent(event: TriggerEvent): event is SnapshotEvent {
    return event.startsWith("snapshot");
  }

  private isDatabaseEvent(event: TriggerEvent): event is DatabaseEvent {
    return event.startsWith("database");
  }

  private dispose() {
    ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
      process.on(signal, () => {
        this.clear();
      })
    );
  }
}
