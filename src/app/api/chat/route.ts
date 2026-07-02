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

Herramientas de datos públicos disponibles:
- "sec_edgar_search": buscar documentos (filings) de empresas en la SEC de EE.UU. vía EDGAR.
- "treasury_rates_of_exchange": tasas de cambio oficiales del Tesoro de EE.UU. para convertir moneda extranjera a USD.
- "courtlistener_search": buscar jurisprudencia y fallos judiciales de EE.UU. (federal y estatal) por tema o partes.
Usá estas herramientas cuando la pregunta se beneficie de datos concretos y verificables. Cuando las uses, citá la fuente (SEC EDGAR / U.S. Treasury / CourtListener) y la fecha del dato. Los fallos son antecedentes, no asesoría legal.`;

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
    },
  });
}
