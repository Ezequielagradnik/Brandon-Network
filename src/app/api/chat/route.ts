import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

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
- "fdic_bank_lookup": consulta la base oficial de la FDIC para verificar bancos de EE. UU. (si existe, si está activo/asegurado, certificado FDIC, activos, sitio web) o bancos que quebraron. Los activos vienen en miles de USD.
- "occ_enforcement_search": busca sanciones y acciones de cumplimiento de la OCC contra bancos nacionales o directivos (órdenes de cese, multas, restituciones, prohibiciones). Útil para due diligence de un banco o persona.
- "occ_institution_search": busca instituciones reguladas por la OCC (bancos nacionales, cajas de ahorro federales), activas o inactivas, por nombre o número de charter.
- "uscis_case_status": consulta el estado de un trámite migratorio de USCIS por número de recibo (3 letras + 10 dígitos). Devuelve formulario, fechas y estado del caso en español e inglés. Solo por número de recibo; no busca por nombre.
Usa estas herramientas cuando la pregunta se beneficie de datos concretos y verificables. Cuando las uses, cita la fuente (SEC EDGAR / U.S. Treasury / CourtListener / FDIC / OCC / USCIS) y la fecha del dato. Los fallos son antecedentes, no asesoría legal.

Formato de la respuesta:
- Usa Markdown: títulos (##), negritas, listas y tablas cuando aporten claridad. Para comparaciones o desgloses, prefiere una tabla Markdown.
- No uses diagramas de flujo en ASCII ni bloques de código para representar procesos, estructuras o relaciones (nada de barras "|", flechas "▼", cajas dibujadas ni arte ASCII: se desalinea y se ve mal). Explica los flujos y los pasos con listas numeradas o texto claro. Reserva los bloques de código solo para código o datos que el usuario deba copiar.
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
  {
    name: "fdic_bank_lookup",
    description:
      "Consulta bancos de EE.UU. en la base oficial de la FDIC (BankFind). Úsalo para verificar si un banco existe y está activo/asegurado por la FDIC, ver su ciudad y estado, número de certificado FDIC, activos totales y sitio web. Con failed=true consulta bancos que quebraron (registro histórico desde 1934). Datos oficiales de la FDIC.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "Nombre o parte del nombre del banco, por ejemplo 'Seacoast', 'JPMorgan' o 'Silicon Valley'.",
        },
        state: {
          type: "string",
          description:
            "Opcional. Estado de EE.UU. en 2 letras para filtrar (solo bancos activos), por ejemplo 'FL', 'NY', 'CA'.",
        },
        failed: {
          type: "boolean",
          description:
            "Opcional. Si es true, busca bancos QUE QUEBRARON en vez de bancos activos.",
        },
      },
      required: [],
    },
  },
  {
    name: "occ_enforcement_search",
    description:
      "Busca sanciones y acciones de cumplimiento (enforcement actions) de la OCC contra bancos nacionales de EE. UU., cajas de ahorro federales y personas (directivos). Útil para due diligence: ver si un banco o directivo tuvo órdenes de cese, multas, restituciones o prohibiciones. Búsqueda por nombre de banco, persona, ciudad o estado. Datos oficiales de la OCC.",
    input_schema: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description:
            "Nombre del banco, de la persona, ciudad o estado. Por ejemplo 'PNC', 'Wells Fargo' o 'Miami'.",
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "occ_institution_search",
    description:
      "Busca instituciones reguladas por la OCC (bancos nacionales, cajas de ahorro federales, sucursales de bancos extranjeros), activas o inactivas, por nombre o número de charter. Devuelve nombre, número de charter, ciudad, estado y si está activa o inactiva. Datos oficiales de la OCC.",
    input_schema: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "Nombre de la institución o número de charter.",
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "uscis_case_status",
    description:
      "Consulta el estado de un trámite migratorio de USCIS (EE. UU.) por número de recibo. El número tiene 13 caracteres: 3 letras + 10 dígitos (por ejemplo 'EAC9999103403'). Devuelve el formulario, las fechas y el estado del caso en español e inglés. Solo consulta por número de recibo; no busca por nombre. Actualmente en ambiente de prueba (sandbox): solo responden recibos de prueba.",
    input_schema: {
      type: "object",
      properties: {
        receiptNumber: {
          type: "string",
          description:
            "Número de recibo de USCIS: 3 letras seguidas de 10 dígitos, por ejemplo 'EAC9999103403'.",
        },
      },
      required: ["receiptNumber"],
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

async function fdicBankLookup(input: {
  name?: string;
  state?: string;
  failed?: boolean;
}) {
  const params = new URLSearchParams({ limit: "8", format: "json" });

  if (input.failed) {
    params.set("fields", "NAME,CITYST,FAILDATE,COST,QBFASSET");
    params.set("sort_by", "FAILDATE");
    params.set("sort_order", "DESC");
    if (input.name) params.set("search", `NAME:${input.name}`);
    const res = await fetch(`https://api.fdic.gov/banks/failures?${params}`);
    if (!res.ok) return `Error FDIC: ${res.status}`;
    const json = await res.json();
    const resultados = (json?.data ?? []).map((r: any) => ({
      banco: r.data?.NAME,
      ciudad_estado: r.data?.CITYST,
      fecha_quiebra: r.data?.FAILDATE,
      activos_miles_usd: r.data?.QBFASSET,
      costo_estimado_miles_usd: r.data?.COST,
    }));
    return JSON.stringify({ total: json?.totals?.count ?? 0, quiebras: resultados });
  }

  params.set("fields", "NAME,CITY,STALP,ACTIVE,WEBADDR,ASSET,CERT,ESTYMD");
  if (input.name) params.set("search", `NAME:${input.name}`);
  if (input.state) params.set("filters", `STALP:${input.state.toUpperCase()}`);
  const res = await fetch(`https://api.fdic.gov/banks/institutions?${params}`);
  if (!res.ok) return `Error FDIC: ${res.status}`;
  const json = await res.json();
  const resultados = (json?.data ?? []).map((r: any) => ({
    banco: r.data?.NAME,
    ciudad: r.data?.CITY,
    estado: r.data?.STALP,
    activo: r.data?.ACTIVE === 1,
    cert_fdic: r.data?.CERT,
    activos_miles_usd: r.data?.ASSET,
    web: r.data?.WEBADDR,
    desde: r.data?.ESTYMD,
  }));
  return JSON.stringify({ total: json?.totals?.count ?? 0, bancos: resultados });
}

const OCC_KEY = process.env.API_DATA_GOV_KEY;

async function occEnforcementSearch(input: { keyword: string }) {
  if (!OCC_KEY) return "OCC no configurado (falta API_DATA_GOV_KEY).";
  const kw = encodeURIComponent((input.keyword || "").trim());
  if (!kw) return "Falta el término de búsqueda.";
  const res = await fetch(
    `https://api.occ.gov/EnforcementActions/list/${kw}?api_key=${OCC_KEY}`,
  );
  if (!res.ok) return `Error OCC: ${res.status}`;
  const arr = await res.json();
  const list = Array.isArray(arr) ? arr : [];
  const sanciones = list.slice(0, 10).map((e: any) => ({
    institucion: e.Institution || null,
    empresa: e.Company || null,
    individuo: e.Individual || null,
    ubicacion: e.Location || null,
    tipo: e.TypeDescription || e.TypeCode || null,
    monto_usd: e.Amount || null,
    fecha_inicio: e.StartDate || null,
    fecha_termino: e.TerminationDate || null,
    expediente: e.DocketNumber || null,
  }));
  return JSON.stringify({ total: list.length, sanciones });
}

async function occInstitutionSearch(input: { keyword: string }) {
  if (!OCC_KEY) return "OCC no configurado (falta API_DATA_GOV_KEY).";
  const kw = encodeURIComponent((input.keyword || "").trim());
  if (!kw) return "Falta el término de búsqueda.";
  const res = await fetch(
    `https://api.occ.gov/Institutions/List/${kw}?api_key=${OCC_KEY}`,
  );
  if (!res.ok) return `Error OCC: ${res.status}`;
  const arr = await res.json();
  const list = Array.isArray(arr) ? arr : [];
  const instituciones = list.slice(0, 10).map((i: any) => ({
    banco: i.BankName || null,
    charter: i.CharterNumber || null,
    ciudad: i.BankCity || null,
    estado: i.BankStateProvinceCode || null,
    estado_institucion: i.InstStatusDesc || null,
    actualizado: i.LastUpdated || null,
  }));
  return JSON.stringify({ total: list.length, instituciones });
}

// --- USCIS: OAuth client-credentials + estado de trámite ---
let uscisTokenCache: { value: string; exp: number } | null = null;

async function uscisGetToken(): Promise<string | null> {
  const id = process.env.USCIS_CLIENT_ID;
  const secret = process.env.USCIS_CLIENT_SECRET;
  const base = process.env.USCIS_BASE || "https://api-int.uscis.gov";
  if (!id || !secret) return null;
  const now = Date.now();
  if (uscisTokenCache && uscisTokenCache.exp > now + 30000) {
    return uscisTokenCache.value;
  }
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${base}/oauth/accesstoken`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const j = await res.json();
  const token = j?.access_token;
  if (!token) return null;
  const ttl = parseInt(j?.expires_in ?? "1500", 10);
  uscisTokenCache = { value: token, exp: now + (isNaN(ttl) ? 1500 : ttl) * 1000 };
  return token;
}

async function uscisCaseStatus(input: { receiptNumber: string }) {
  const base = process.env.USCIS_BASE || "https://api-int.uscis.gov";
  const rn = (input.receiptNumber || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]{3}\d{10}$/.test(rn)) {
    return JSON.stringify({
      error:
        "Número de recibo inválido. Debe ser 3 letras seguidas de 10 dígitos, por ejemplo EAC9999103403.",
    });
  }
  const token = await uscisGetToken();
  if (!token)
    return "USCIS no configurado (faltan credenciales) o no se pudo autenticar.";
  const res = await fetch(`${base}/case-status/${rn}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return `Error USCIS: ${res.status}`;
  const j = await res.json();
  const cs = j?.case_status;
  if (!cs || !cs.receiptNumber) {
    return JSON.stringify({
      encontrado: false,
      receiptNumber: rn,
      nota: "Sin datos para ese número de recibo. En sandbox solo responden los recibos de prueba.",
    });
  }
  return JSON.stringify({
    encontrado: true,
    receiptNumber: cs.receiptNumber,
    formulario: cs.formType,
    enviado: cs.submittedDate,
    actualizado: cs.modifiedDate,
    estado_es: cs.current_case_status_text_es || cs.current_case_status_text_en,
    detalle_es: cs.current_case_status_desc_es || cs.current_case_status_desc_en,
    estado_en: cs.current_case_status_text_en,
    detalle_en: cs.current_case_status_desc_en,
  });
}

async function runTool(name: string, input: unknown): Promise<string> {
  try {
    if (name === "sec_edgar_search") return await secEdgarSearch(input as never);
    if (name === "treasury_rates_of_exchange")
      return await treasuryRates(input as never);
    if (name === "courtlistener_search")
      return await courtListenerSearch(input as never);
    if (name === "fdic_bank_lookup") return await fdicBankLookup(input as never);
    if (name === "occ_enforcement_search")
      return await occEnforcementSearch(input as never);
    if (name === "occ_institution_search")
      return await occInstitutionSearch(input as never);
    if (name === "uscis_case_status")
      return await uscisCaseStatus(input as never);
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
