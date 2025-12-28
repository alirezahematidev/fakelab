import { type Emitter } from "mitt";
export { type Handler } from "mitt";

type SnapshotEventType = "captured" | "refreshed" | "deleted";

type EventMap<T extends TriggerEvent, P = unknown> = Record<T, P>;

type InferredType<T extends string> = T extends "snapshot" ? SnapshotEventType : never;

type EventBuilder<Scope extends string> = `${Lowercase<Scope>}:${InferredType<Scope>}`;

export type SnapshotEvent = EventBuilder<"snapshot">;

export type SnapshotEmitter = Emitter<EventMap<SnapshotEvent, SnapshotEventArgs>>;

export type SnapshotEventArgs = {
  readonly url: string;
  readonly name: string;
  readonly content?: string;
};

export type TriggerEvent = SnapshotEvent;

export type EmitterEventMap = EventMap<TriggerEvent>;
