import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const anthropic = new Anthropic();

const SYSTEM = `Eres el asistente de IA de Brandon Network, un producto de Brandon Latam (protección patrimonial, Coral Gables, Miami) para sus clientes: familias, empresarios y fundaciones de Latinoamérica con patrimonio e intereses en Estados Unidos.

Tu foco es finanzas, temas legales y datos tributarios (IRS, formularios W-8BEN / 1042-S / 8821, transcripts, planificación patrimonial y sucesoria, estructuras en EE. UU.).

Reglas:
- Responde SIEMPRE en el mismo idioma en el que escribe el usuario (español, inglés o portugués).
- En español, usa un español neutro, profesional y de alcance internacional. No uses voseo ni regionalismos: evita "vos", "tenés", "podés", "acá", "che" y modismos locales. Mantén un registro claro y formal, válido para cualquier país de Latinoamérica.
- Nunca comentes ni aclares nada sobre el idioma, el dialecto o el registro del usuario, ni que respondes en español neutro. Prohibido agregar notas del tipo "Detecto que...", "Nota importante", o cualquier preámbulo sobre el idioma. Responde directamente a la consulta, sin meta-comentarios.
- Sé claro, concreto y accionable. Sin relleno ni descargos de responsabilidad extensos.
- No inventes cifras, formularios, plazos ni normas: si no tienes certeza, indícalo y explica cómo verificarlo.
- No sustituyes la asesoría legal o contable formal; para decisiones sensibles, recomienda validar con el equipo de Brandon.

Herramientas de datos públicos disponibles:
- "sec_edgar_search": busca documentos (filings) de empresas en la SEC de EE. UU. mediante EDGAR.
- "treasury_rates_of_exchange": tasas de cambio oficiales del Tesoro de EE. UU. para convertir moneda extranjera a USD.
- "courtlistener_search": busca jurisprudencia y fallos judiciales de EE. UU. (federal y estatal) por tema o partes.
Usa estas herramientas cuando la pregunta se beneficie de datos concretos y verificables. Cuando las uses, cita la fuente (SEC EDGAR / U.S. Treasury / CourtListener) y la fecha del dato. Los fallos son antecedentes, no asesoría legal.

Formato de la respuesta:
- Usa Markdown: títulos (##), negritas, listas y tablas cuando aporten claridad. Para comparaciones o desgloses, prefiere una tabla Markdown.
- Termina SIEMPRE con un consejo destacado, como cita (blockquote) en una sola línea, con este formato exacto:
> **Tip Brandon Network:** <consejo breve y accionable; cuando corresponda, invita a validar con el equipo de Brandon>.`;

const tools: Anthropic.Tool[] = [
  {
    name: "sec_edgar_search",
    description:
      "Busca documentos (filings) presentados ante la SEC de EE.UU. mediante EDGAR full-text search. Sirve para encontrar presentaciones de empresas (10-K, 10-Q, 8-K, S-1, etc.), menciones y datos públicos de compañías que reportan a la SEC. Devuelve empresa, tipo de formulario, fecha y número de accession.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Términos de búsqueda: nombre de empresa, ticker o tema.",
        },
        forms: {
          type: "string",
          description:
            "Opcional. Tipo de formulario para filtrar, por ejemplo '10-K', '8-K' o 'S-1'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "treasury_rates_of_exchange",
    description:
      "Obtiene las tasas de cambio oficiales del Tesoro de EE.UU. (Treasury Reporting Rates of Exchange), usadas para convertir moneda extranjera a USD a efectos de reportes. Devuelve las tasas más recientes (dato trimestral), opcionalmente filtradas por país.",
    input_schema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description:
            "Opcional. País en inglés para filtrar, por ejemplo 'Argentina', 'Brazil', 'Mexico', 'Colombia', 'Chile'.",
        },
      },
      required: [],
    },
  },
  {
    name: "courtlistener_search",
    description:
      "Busca jurisprudencia y opiniones judiciales de EE.UU. (federal y estatal) en CourtListener / Free Law Project. Útil para encontrar antecedentes sobre temas legales, fiscales o patrimoniales (trusts, herencias, tributación de no residentes, etc.). Devuelve caso, tribunal, fecha y enlace.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Tema o partes a buscar, por ejemplo 'trust taxation nonresident'.",
        },
      },
      required: ["query"],
    },
  },
];

async function secEdgarSearch(input: { query: string; forms?: string }) {
  const params = new URLSearchParams({ q: input.query });
  if (input.forms) params.set("forms", input.forms);
  const res = await fetch(`https://efts.sec.gov/LATEST/search-index?${params}`, {
    headers: { "User-Agent": "Brandon Network research@bblatam.com" },
  });
  if (!res.ok) return `Error EDGAR: ${res.status}`;
  const json = await res.json();
  const hits = (json?.hits?.hits ?? []).slice(0, 6).map((h: any) => ({
    empresa: h._source?.display_names?.[0],
    formulario: h._source?.form,
    fecha: h._source?.file_date,
    accession: h._source?.adsh,
    tipo_archivo: h._source?.file_type,
  }));
  return JSON.stringify({ total: json?.hits?.total?.value ?? 0, resultados: hits });
}

async function treasuryRates(input: { country?: string }) {
  let url =
    "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange" +
    "?sort=-record_date&fields=country,currency,exchange_rate,record_date,effective_date";
  if (input.country) {
    url += `&filter=country%3Aeq%3A${encodeURIComponent(input.country)}&page%5Bsize%5D=4`;
  } else {
    url += "&page%5Bsize%5D=25";
  }
  const res = await fetch(url);
  if (!res.ok) return `Error Treasury: ${res.status}`;
  const json = await res.json();
  return JSON.stringify(json?.data ?? []);
}

async function courtListenerSearch(input: { query: string }) {
  const params = new URLSearchParams({
    q: input.query,
    type: "o",
    order_by: "score desc",
  });
  const headers: Record<string, string> = {
    "User-Agent": "Brandon Network research@bblatam.com",
  };
  if (process.env.COURTLISTENER_API_TOKEN) {
    headers.Authorization = `Token ${process.env.COURTLISTENER_API_TOKEN}`;
  }
  const res = await fetch(
    `https://www.courtlistener.com/api/rest/v4/search/?${params}`,
    { headers },
  );
  if (!res.ok) return `Error CourtListener: ${res.status}`;
  const json = await res.json();
  const results = (json?.results ?? []).slice(0, 5).map((r: any) => ({
    caso: r.caseName,
    tribunal: r.court,
    fecha: r.dateFiled,
    url: r.absolute_url ? `https://www.courtlistener.com${r.absolute_url}` : null,
  }));
  return JSON.stringify({ total: json?.count ?? 0, resultados: results });
}

async function runTool(name: string, input: unknown): Promise<string> {
  try {
    if (name === "sec_edgar_search") return await secEdgarSearch(input as never);
    if (name === "treasury_rates_of_exchange")
      return await treasuryRates(input as never);
    if (name === "courtlistener_search")
      return await courtListenerSearch(input as never);
    return `Herramienta desconocida: ${name}`;
  } catch (e) {
    return `Error al ejecutar ${name}: ${String(e)}`;
  }
}

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

  // Sistema de créditos: cada pregunta cuesta COST (500 créditos = 10 preguntas)
  const COST = 50;
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
            max_tokens: 4096,
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
      "X-Credits-Remaining": String(remaining),
    },
  });
}
