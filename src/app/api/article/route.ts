import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

// Cuando un medio con muro de pago (ej. SeekingAlpha) bloquea la nota, el
// extractor devuelve el menú/nav en vez del artículo. Lo detectamos para
// caer al resumen limpio.
function looksLikeJunk(t: string) {
  const head = t.slice(0, 600).toLowerCase();
  return /skip to content|create free account|power to investors|sign in to continue|subscribe to (continue|read)|enable javascript|please enable/i.test(
    head,
  );
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const target = new URL(req.url).searchParams.get("url");
  if (!target) return new Response("url requerido", { status: 400 });

  // 1) World News API: texto completo confiable (medios abiertos)
  const wnKey = process.env.WORLD_NEWS_API_KEY;
  if (wnKey) {
    try {
      const r = await fetch(
        `https://api.worldnewsapi.com/extract-news?url=${encodeURIComponent(target)}&api-key=${wnKey}`,
        { cache: "no-store", signal: AbortSignal.timeout(20000) },
      );
      if (r.ok) {
        const j = await r.json();
        const text = (j?.text || "").trim();
        if (text.length >= 200 && !looksLikeJunk(text)) {
          return Response.json(
            { ok: true, content: text.slice(0, 12000) },
            {
              headers: {
                "Cache-Control": "s-maxage=600, stale-while-revalidate=3600",
              },
            },
          );
        }
      }
    } catch {
      /* seguimos con el fallback */
    }
  }

  // 2) Fallback: Jina Reader (gratis)
  try {
    const r = await fetch(`https://r.jina.ai/${target}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Retain-Images": "none",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return Response.json({ ok: false });

    let text = await r.text();
    const idx = text.indexOf("Markdown Content:");
    if (idx >= 0) text = text.slice(idx + "Markdown Content:".length);

    text = text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // imágenes
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> texto
      .replace(/^#{1,6}\s*/gm, "") // encabezados markdown
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1") // negritas/itálicas
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 8000);

    if (text.length < 200) return Response.json({ ok: false });
    return Response.json(
      { ok: true, content: text },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=3600" } },
    );
  } catch {
    return Response.json({ ok: false });
  }
}
