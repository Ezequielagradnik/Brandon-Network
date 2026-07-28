// ID estable y corto derivado del link de la nota. Sirve para la URL
// (/dashboard/noticias/<id>) y para recuperar la nota desde sessionStorage,
// sin depender de qué fuente la trajo.
export function newsId(link: string): string {
  let h = 5381;
  for (let i = 0; i < link.length; i++) {
    h = ((h << 5) + h + link.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export const NEWS_STASH_PREFIX = "bn-news:";
