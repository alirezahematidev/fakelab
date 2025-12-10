import pico from "picocolors";

type LogLevel = "info" | "warn" | "error" | "success";

export class Logger {
  private static prefix(level: LogLevel) {
    const time = new Date().toLocaleTimeString();

    const colors = {
      info: pico.blue,
      warn: pico.yellow,
      error: pico.red,
      success: pico.green,
      debug: pico.magenta,
    } as const;

    return colors[level](`[${time}] FAKELAB_${level.toUpperCase()}`);
  }

  private static log(level: LogLevel, message: string, ...params: unknown[]) {
    const color = pico.white;
    const prefix = Logger.prefix(level);

    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

    fn(prefix, color(message), ...params);
  }

  static info(message: string, ...params: unknown[]) {
    this.log("info", message, ...params);
  }

  static warn(message: string, ...params: unknown[]) {
    this.log("warn", message, ...params);
  }

  static error(message: string, ...params: unknown[]) {
    this.log("error", message, ...params);
  }

  static success(message: string, ...params: unknown[]) {
    this.log("success", message, ...params);
  }
}
