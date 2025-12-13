import type { FakerLocale } from "./types";

export const FAKELABE_DEFAULT_PREFIX = "api";
export const FAKELAB_DEFAULT_PORT = 5200;

export function defaultFakerLocale() {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;

  if (!locale) return "en";

  const [lang] = locale.split("-");

  return lang.toLowerCase() as FakerLocale;
}
