import pico from "picocolors";

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "unit",
});

type LogLevel = "info" | "error" | "warn" | "success";
export class Logger {
  private static label(level: LogLevel) {
    switch (level) {
      case "info":
        return pico.blueBright(level.toUpperCase());
      case "error":
        return pico.redBright(level.toUpperCase());
      case "warn":
        return pico.yellowBright(level.toUpperCase());
      case "success":
        return pico.greenBright(level.toUpperCase());
    }
  }

  private static log(level: LogLevel, message: string) {
    return [pico.dim(`[${new Date().toISOString()}]`), this.label(level), message].join(" ");
  }

  static blue(text: string) {
    return pico.blueBright(text);
  }

  static gray(text: string) {
    return pico.dim(text);
  }

  static red(text: string) {
    return pico.redBright(text);
  }

  static yellow(text: string) {
    return pico.yellowBright(text);
  }

  static green(text: string) {
    return pico.greenBright(text);
  }

  static dim(message: string, ...params: unknown[]) {
    console.log(this.log("info", pico.dim(message)), ...params);
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

  static success(message: string, ...params: unknown[]) {
    console.log(this.log("success", message), ...params);
  }

  static list(items: string[]) {
    return formatter.format(items);
  }
}
