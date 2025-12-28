import { type Emitter } from "mitt";
export { type Handler } from "mitt";

export type ServerEvent = "server:started" | "server:shutdown";

export type SnapshotEvent = "snapshot:captured" | "snapshot:refreshed" | "snapshot:deleted";

type EventMap<T extends TriggerEvent, P = unknown> = Record<T, P>;

export type SnapshotEmitter = Emitter<EventMap<SnapshotEvent, Readonly<SnapshotEventArgs>>>;
export type ServerEmitter = Emitter<EventMap<ServerEvent, Readonly<ServerEventArgs>>>;

export type SnapshotEventArgs = {
  url: string;
  name: string;
  content?: string;
};

export type ServerEventArgs = {
  port: number;
  prefix: string;
};

export type TriggerEvent = ServerEvent | SnapshotEvent;

export type EmitterEventMap = EventMap<TriggerEvent>;
