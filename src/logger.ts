import winston from "winston";
import pico from "picocolors";

function colorize(level: string) {
  switch (level) {
    case "info":
      return pico.blueBright(level.toUpperCase());
    case "error":
      return pico.redBright(level.toUpperCase());
    case "warn":
      return pico.yellowBright(level.toUpperCase());
    default:
      return level.toUpperCase();
  }
}

const fakeformat = winston.format.printf(({ level, message, timestamp }) => {
  return `${pico.dim(`[${timestamp}]`)} ${colorize(level)} ${message}`;
});

const logger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.splat(), fakeformat),
  transports: [new winston.transports.Console()],
});

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "unit",
});

export class Logger {
  static info(message: string, ...params: unknown[]) {
    return logger.info(message, ...params);
  }
  static warn(message: string, ...params: unknown[]) {
    return logger.warn(message, ...params);
  }

  static error(message: string, ...params: unknown[]) {
    return logger.error(message, ...params);
  }

  static list(items: string[]) {
    return formatter.format(items);
  }

  static close() {
    logger.removeAllListeners();
    logger.close();
  }
}
