import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const anthropic = new Anthropic();

type Msg = { role: "user" | "assistant"; content: string };
type Summary = {
  asunto?: string;
  saludo?: string;
  resumen?: string;
  puntos_clave?: string[];
  temas?: { titulo: string; detalle: string }[];
  proximos_pasos?: string[];
};

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(d: Summary, name: string, origin: string) {
  const saludo = d.saludo || (name ? `Hola ${name},` : "Hola,");
  const puntos = (d.puntos_clave ?? [])
    .map(
      (p) =>
        `<li style="margin:0 0 8px;padding-left:4px">${esc(p)}</li>`,
    )
    .join("");
  const temas = (d.temas ?? [])
    .map(
      (t) => `
      <div style="margin:0 0 18px">
        <div style="font-weight:600;color:#0B1B2E;font-size:15px;margin:0 0 4px">${esc(t.titulo)}</div>
        <div style="color:#33475b;font-size:14px;line-height:1.6">${esc(t.detalle)}</div>
      </div>`,
    )
    .join("");
  const pasos = (d.proximos_pasos ?? [])
    .map((p) => `<li style="margin:0 0 8px;padding-left:4px">${esc(p)}</li>`)
    .join("");

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#EFEBE2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#11243B">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="background:#0B1B2E;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
      <img src="${origin}/brand/brandon-network-white.png" alt="Brandon Latam Network" width="220" style="max-width:220px;height:auto"/>
    </div>
    <div style="background:#ffffff;padding:32px;border-left:1px solid #e7e2d6;border-right:1px solid #e7e2d6">
      <p style="margin:0 0 18px;font-size:15px">${esc(saludo)}</p>
      ${
        d.resumen
          ? `<div style="background:#FBF6E9;border:1px solid rgba(194,161,91,.3);border-radius:12px;padding:16px 18px;margin:0 0 24px">
               <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9A7B32;font-weight:700;margin:0 0 6px">Resumen</div>
               <div style="font-size:15px;line-height:1.6;color:#0B1B2E">${esc(d.resumen)}</div>
             </div>`
          : ""
      }
      ${
        puntos
          ? `<div style="margin:0 0 24px">
               <div style="font-size:16px;font-weight:700;color:#0B1B2E;margin:0 0 10px">Puntos clave</div>
               <ul style="margin:0;padding:0 0 0 20px;font-size:14px;line-height:1.6;color:#33475b">${puntos}</ul>
             </div>`
          : ""
      }
      ${
        temas
          ? `<div style="margin:0 0 24px">
               <div style="font-size:16px;font-weight:700;color:#0B1B2E;margin:0 0 12px">Detalle</div>
               ${temas}
             </div>`
          : ""
      }
      ${
        pasos
          ? `<div style="margin:0 0 8px">
               <div style="font-size:16px;font-weight:700;color:#0B1B2E;margin:0 0 10px">Próximos pasos</div>
               <ul style="margin:0;padding:0 0 0 20px;font-size:14px;line-height:1.6;color:#33475b">${pasos}</ul>
             </div>`
          : ""
      }
    </div>
    <div style="background:#ffffff;border:1px solid #e7e2d6;border-top:2px solid #C2A15B;border-radius:0 0 16px 16px;padding:20px 32px">
      <p style="margin:0;font-size:11px;line-height:1.6;color:#8a94a3">
        Este resumen fue generado por el asistente de Brandon Latam Network y tiene fines informativos; no reemplaza el asesoramiento profesional. Para decisiones sensibles, validá con el equipo de Brandon.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return new Response("Email no configurado (falta RESEND_API_KEY)", {
      status: 503,
    });
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();
  const email = prof?.email || user.email;
  const name = (prof?.full_name || "").trim().split(/\s+/)[0] || "";
  if (!email) return new Response("El usuario no tiene email", { status: 400 });

  let messages: Msg[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("messages requerido", { status: 400 });
    }
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const transcript = messages
    .filter((m) => m.content?.trim())
    .map(
      (m) =>
        `${m.role === "user" ? "CLIENTE" : "ASISTENTE"}: ${m.content}`,
    )
    .join("\n\n")
    .slice(0, 30000);

  // Estructurar con Haiku
  let summary: Summary | null = null;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: `Resumís una conversación entre un cliente y el asistente de asesoría patrimonial y fiscal de Brandon Latam Network, para enviarla por email al cliente. Escribí en el MISMO idioma de la conversación, claro y ejecutivo. Devolvé SOLO un JSON válido, sin texto adicional, con esta forma exacta:
{"asunto":"asunto breve del email","saludo":"saludo personal","resumen":"1 o 2 frases con lo esencial","puntos_clave":["punto breve","..."],"temas":[{"titulo":"tema","detalle":"explicación en 1-3 frases"}],"proximos_pasos":["acción sugerida","..."]}
Si algo no aplica, dejá el arreglo vacío. No inventes datos que no estén en la conversación.`,
      messages: [{ role: "user", content: transcript }],
    });
    const raw = msg.content.find((b) => b.type === "text");
    const txt = raw && raw.type === "text" ? raw.text : "";
    const m = txt.match(/\{[\s\S]*\}/);
    if (m) summary = JSON.parse(m[0]);
  } catch {
    summary = null;
  }
  if (!summary) {
    return new Response("No se pudo generar el resumen", { status: 500 });
  }

  const origin = new URL(req.url).origin;
  const html = buildHtml(summary, name, origin);
  const from =
    process.env.EMAIL_FROM || "Brandon Latam Network <onboarding@resend.dev>";
  const subject = summary.asunto || "Resumen de tu conversación con Brandon Latam Network";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [email], subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return new Response(`Error al enviar: ${res.status} ${detail}`, {
      status: 502,
    });
  }

  return Response.json({ ok: true, to: email });
}
