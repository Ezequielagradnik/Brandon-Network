import { cookies } from "next/headers";
import { dict, type Lang, type Dict } from "@/lib/i18n";

export const LANG_COOKIE = "bn-lang";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const v = store.get(LANG_COOKIE)?.value;
  return v === "en" || v === "pt" ? v : "es";
}

export async function getT(): Promise<Dict> {
  return dict[await getLang()];
}
