import { allLocales } from "@faker-js/faker";

export const CONFIG_FILE_NAME = "fakelab.config.ts";

export const FAKER_LOCALES = Object.keys(allLocales) as Array<FakerLocale>;

export type FakerLocale = keyof typeof allLocales;
