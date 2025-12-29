import mitt from "mitt";
import type { ServerOptions } from "../../types";
import type { ServerEvent, ServerEventArgs } from "../types";
import { BaseSubscriber } from "./base";

export class ServerEventSubscriber extends BaseSubscriber<ServerEvent, ServerEventArgs> {
  constructor() {
    const $emitter = mitt<Record<ServerEvent, ServerEventArgs>>();

    super($emitter);

    this.started = this.started.bind(this);
    this.shutdown = this.shutdown.bind(this);
  }

  public started({ pathPrefix, port }: Required<ServerOptions>) {
    this.$emitter.emit("server:started", { port, prefix: pathPrefix });
  }

  public shutdown({ pathPrefix, port }: Required<ServerOptions>) {
    this.$emitter.emit("server:shutdown", { port, prefix: pathPrefix });
  }
}
