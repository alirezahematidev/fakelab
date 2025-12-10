import type { FakerLocale } from "./types";

class Constants {
  static PREFIX = "api";
  static PORT = 5200;
  private static DEFAULT_LOCALE = "en" as const;

  static locale(): FakerLocale {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;

    if (!locale) return this.DEFAULT_LOCALE;

    const [lang] = locale.split("-");

    return lang.toLowerCase() as FakerLocale;
  }
}

export { Constants };
