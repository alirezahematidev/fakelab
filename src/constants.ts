export const FAKELABE_DEFAULT_PREFIX = "api";
export const FAKELAB_DEFAULT_PORT = 5200;
export const RUNTIME_DEFAULT_NAME = "fakelab";
export const RUNTIME_DEFAULT_MODE = "module";

export const FAKER_LOCALES = [
  "af",
  "ar",
  "az",
  "bn",
  "cs",
  "cy",
  "da",
  "de",
  "dv",
  "el",
  "en",
  "eo",
  "es",
  "fa",
  "fi",
  "fr",
  "he",
  "hr",
  "hu",
  "hy",
  "id",
  "it",
  "ja",
  "ka",
  "ko",
  "ku",
  "lv",
  "mk",
  "nb",
  "ne",
  "nl",
  "pl",
  "pt",
  "ro",
] as const;

export function defaultFakerLocale(): FakerLocale {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;

  if (!locale) return "en";

  const [lang] = locale.split("-");

  const asFakerLocale = lang.toLowerCase() as FakerLocale;

  if (!FAKER_LOCALES.includes(asFakerLocale)) return "en";

  return asFakerLocale;
}

export type FakerLocale = (typeof FAKER_LOCALES)[number];
