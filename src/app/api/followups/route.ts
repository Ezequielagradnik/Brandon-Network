import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 20;

const anthropic = new Anthropic();

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ questions: [] });
  }

  let incoming: ChatMessage[];
  try {
    const body = await req.json();
    incoming = body.messages;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return Response.json({ questions: [] });
    }
  } catch {
    return Response.json({ questions: [] });
  }

  // Solo el último ida y vuelta alcanza para sugerir seguimientos
  const tail = incoming.slice(-4);
  const transcript = tail
    .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
    .join("\n\n")
    .slice(0, 6000);

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system:
        "Sos parte del asistente de Brandon Network (finanzas, legal y tributario de EE.UU. para clientes de Latinoamérica). A partir de la conversación, generá 3 preguntas de seguimiento breves que el usuario probablemente querría hacer a continuación. Reglas: escribí en el MISMO idioma que usó el usuario. Cada pregunta en primera persona, concreta y accionable, máximo 9 palabras. Devolvé SOLO un arreglo JSON de 3 strings, sin texto adicional.",
      messages: [{ role: "user", content: transcript }],
    });

    const text =
      res.content[0]?.type === "text" ? res.content[0].text.trim() : "";
    const match = text.match(/\[[\s\S]*\]/);
    let questions: string[] = [];
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          questions = parsed
            .filter((q) => typeof q === "string")
            .map((q) => q.trim())
            .filter(Boolean)
            .slice(0, 3);
        }
      } catch {
        /* sin sugerencias */
      }
    }
    return Response.json({ questions });
  } catch (e) {
    console.error("followups error", e);
    return Response.json({ questions: [] });
  }
}
