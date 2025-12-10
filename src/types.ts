import type { Type } from "ts-morph";

export type EvaluatedFakerArgs = { path: string; args: any } | undefined;
export type LazyFaker = typeof import("@faker-js/faker").faker;

type GeneratorForge = { data: unknown; json: string };

export type ForgeOptions = {
  count?: string;
  uid?: string;
  s?: string;
};

export interface IGenerated {
  readonly entities: Map<string, Type>;
  forge: (type: Type, options: ForgeOptions) => Promise<GeneratorForge>;
}

export type Booleanish = "true" | "false";

export interface MockOptions {
  locale?: string;
}
export type FakerLocale =
  | "af"
  | "ar"
  | "az"
  | "bn"
  | "cs"
  | "cy"
  | "da"
  | "de"
  | "dv"
  | "el"
  | "en"
  | "eo"
  | "es"
  | "fa"
  | "fi"
  | "fr"
  | "he"
  | "hr"
  | "hu"
  | "hy"
  | "id"
  | "it"
  | "ja"
  | "ka"
  | "ko"
  | "ku"
  | "lv"
  | "mk"
  | "nb"
  | "ne"
  | "nl"
  | "pl"
  | "pt"
  | "ro";
