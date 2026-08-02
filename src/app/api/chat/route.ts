import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM } from "@/lib/assistant/system";
import { tools, runTool } from "@/lib/assistant/tools";

export const maxDuration = 300;

const anthropic = new Anthropic();

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Falta configurar ANTHROPIC_API_KEY", { status: 500 });
  }

  let incoming: ChatMessage[];
  try {
    const body = await req.json();
    incoming = body.messages;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return new Response("messages requerido", { status: 400 });
    }
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  // Sistema de créditos: cada pregunta cuesta COST (500 créditos = 10 preguntas).
  // Los admins tienen crédito ilimitado (no se les cobra).
  const COST = 50;
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = prof?.role === "admin";

  let creditsHeader = "unlimited";
  if (!isAdmin) {
    const { data: remaining, error: creditErr } = await supabase.rpc(
      "spend_credits",
      { cost: COST },
    );
    if (creditErr) {
      return new Response("No se pudieron verificar los créditos", { status: 500 });
    }
    if (typeof remaining !== "number" || remaining < 0) {
      return new Response("Sin créditos", { status: 402 });
    }
    creditsHeader = String(remaining);
  }

  const messages: Anthropic.MessageParam[] = incoming.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Loop de tool-use con streaming de texto en cada iteración
        for (let i = 0; i < 5; i++) {
          const turn = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 16000,
            system: SYSTEM,
            tools,
            messages,
          });

          turn.on("text", (text) => controller.enqueue(encoder.encode(text)));

          const final = await turn.finalMessage();
          messages.push({ role: "assistant", content: final.content });

          if (final.stop_reason !== "tool_use") break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type === "tool_use") {
              const result = await runTool(block.name, block.input);
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            }
          }
          messages.push({ role: "user", content: toolResults });
        }
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
      "X-Credits-Remaining": creditsHeader,
    },
  });
}
