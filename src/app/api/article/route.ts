import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const target = new URL(req.url).searchParams.get("url");
  if (!target) return new Response("url requerido", { status: 400 });

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
