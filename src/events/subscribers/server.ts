import { Logger } from "../../logger";
import type { ServerOptions } from "../../types";
import type { Handler, ServerEmitter, ServerEvent, ServerEventArgs } from "../types";

export class ServerEventSubscriber {
  constructor(private $emitter: ServerEmitter) {
    this.started = this.started.bind(this);
    this.shutdown = this.shutdown.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  public started({ pathPrefix, port }: Required<ServerOptions>) {
    this.$emitter.emit("server:started", { port, prefix: pathPrefix });
  }

  public shutdown({ pathPrefix, port }: Required<ServerOptions>) {
    this.$emitter.emit("server:shutdown", { port, prefix: pathPrefix });
  }

  public subscribe(name: string, event: ServerEvent, handler: Handler<ServerEventArgs>) {
    this.$emitter.on(event, handler);

    return () => {
      Logger.info("Webhook %s unsubscribed.", Logger.blue(name));
      this.$emitter.off(event, handler);
    };
  }
}
