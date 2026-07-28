import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const anthropic = new Anthropic();

// Cuando un medio con muro de pago (ej. SeekingAlpha) bloquea la nota, el
// extractor devuelve el menú/nav en vez del artículo. Lo detectamos para
// caer al resumen limpio.
function looksLikeJunk(t: string) {
  const head = t.slice(0, 600).toLowerCase();
  return /skip to content|skip navigation|create free account|power to investors|pre-markets|sign in to continue|subscribe to (continue|read)|enable javascript|please enable/i.test(
    head,
  );
}

const LANG_NAME: Record<string, string> = {
  es: "español neutro",
  en: "English",
  pt: "português",
};

// 3-4 puntos clave de la nota, en el idioma de la plataforma. Barato (Haiku)
// y se cachea junto con la respuesta (s-maxage), así no se recalcula por vista.
async function keyPoints(content: string, lang: string): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY || content.length < 300) return [];
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: `Extraé los 3 o 4 puntos clave de la noticia en ${LANG_NAME[lang] ?? "español neutro"}. Cada punto: una frase corta, concreta, sin numerar. Devolvé SOLO un array JSON de strings, sin texto adicional.`,
      messages: [{ role: "user", content: content.slice(0, 8000) }],
    });
    const raw = msg.content.find((b) => b.type === "text");
    const txt = raw && raw.type === "text" ? raw.text : "";
    const m = txt.match(/\[[\s\S]*\]/);
    if (!m) return [];
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
  } catch {
    return [];
  }
}

const CACHE = "s-maxage=600, stale-while-revalidate=3600";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const params = new URL(req.url).searchParams;
  const target = params.get("url");
  const lang = params.get("lang") || "es";
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
          const content = text.slice(0, 12000);
          const points = await keyPoints(content, lang);
          return Response.json(
            { ok: true, content, keyPoints: points },
            { headers: { "Cache-Control": CACHE } },
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
    const points = await keyPoints(text, lang);
    return Response.json(
      { ok: true, content: text, keyPoints: points },
      { headers: { "Cache-Control": CACHE } },
    );
  } catch {
    return Response.json({ ok: false });
  }
}
