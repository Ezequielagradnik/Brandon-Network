import { es } from "./es";
import { en } from "./en";
import { pt } from "./pt";

export type Lang = "es" | "en" | "pt";

export const LANGS: Lang[] = ["es", "en", "pt"];

export const dict = { es, en, pt };

export type Dict = (typeof dict)[Lang];

export function getDict(lang: Lang): Dict {
  return dict[lang];
}
