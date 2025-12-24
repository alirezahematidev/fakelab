import pico from "picocolors";

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "unit",
});

type LogLevel = "info" | "error" | "warn";
export class Logger {
  private static label(level: LogLevel) {
    switch (level) {
      case "info":
        return pico.blueBright(level.toUpperCase());
      case "error":
        return pico.redBright(level.toUpperCase());
      case "warn":
        return pico.yellowBright(level.toUpperCase());
    }
  }

  private static log(level: LogLevel, message: string) {
    return [pico.dim(`[${new Date().toISOString()}]`), this.label(level), message].join(" ");
  }

  static info(message: string, ...params: unknown[]) {
    console.log(this.log("info", message), ...params);
  }

  static warn(message: string, ...params: unknown[]) {
    console.log(this.log("warn", message), ...params);
  }

  static error(message: string, ...params: unknown[]) {
    console.error(this.log("error", message), ...params);
  }

  static debug(message: string, ...params: unknown[]) {
    if (typeof process === "undefined" || !process.env.DEBUG) return;

    console.log(this.log("info", message), ...params);
  }

  static list(items: string[]) {
    return formatter.format(items);
  }
}
