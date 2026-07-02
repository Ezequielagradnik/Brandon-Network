import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const anthropic = new Anthropic();

const SYSTEM = `Sos el asistente de IA de Brandon Network, un producto de Brandon Latam (protección patrimonial, Coral Gables, Miami) para sus clientes: familias, emprendedores y fundaciones de Latinoamérica con patrimonio e intereses en Estados Unidos.

Tu foco es finanzas, cuestiones legales y datos tributarios (IRS, formularios W-8BEN / 1042-S / 8821, transcripts, planificación patrimonial y sucesoria, estructuras en EE.UU.).

Reglas:
- Respondé SIEMPRE en el mismo idioma en el que te escribe el usuario (español, inglés o portugués).
- Sé claro, concreto y accionable. Nada de relleno ni disclaimers largos.
- No inventes cifras, formularios, plazos ni normas: si no estás seguro, decilo y explicá cómo verificarlo.
- No sos un sustituto de asesoría legal o contable formal; para decisiones sensibles, recomendá validar con el equipo de Brandon.
- Todavía no tenés acceso a los datos privados del cliente ni a fuentes externas en vivo (eso llega pronto). Trabajá con la información que te dan y con conocimiento general.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  // Gate: solo usuarios logueados
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Falta configurar ANTHROPIC_API_KEY", { status: 500 });
  }

  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("messages requerido", { status: 400 });
    }
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claude = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: SYSTEM,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        claude.on("text", (text) => {
          controller.enqueue(encoder.encode(text));
        });

        await claude.finalMessage();
        controller.close();
      } catch (err) {
        console.error("chat error", err);
        controller.enqueue(
          encoder.encode(
            "\n\n[Hubo un error al procesar la respuesta. Probá de nuevo.]",
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
