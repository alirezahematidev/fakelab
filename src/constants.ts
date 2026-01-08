import { allLocales } from "@faker-js/faker";

export const FAKELABE_DEFAULT_PREFIX = "api";
export const FAKELAB_DEFAULT_PORT = 5200;
export const RUNTIME_DEFAULT_NAME = "fakelab";
export const RUNTIME_DEFAULT_MODE = "module";

export const FAKER_LOCALES = Object.keys(allLocales) as Array<FakerLocale>;

export function defaultFakerLocale(): FakerLocale {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;

  if (!locale) return "en";

  const [lang] = locale.split("-") as [FakerLocale];

  if (!FAKER_LOCALES.includes(lang)) return "en";

  return lang;
}

export type FakerLocale = keyof typeof allLocales;
