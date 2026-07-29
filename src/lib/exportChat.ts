// Exporta una conversación a PDF con pdfmake: descarga directa (sin diálogo de
// impresión), texto vectorial seleccionable, listo para enviar a un tercero.

type Msg = { role: "user" | "assistant"; content: string };

// pdfmake usa tipos laxos para el docDefinition; lo tratamos como any acá.
/* eslint-disable @typescript-eslint/no-explicit-any */

// La fuente embebida (Roboto) no tiene emojis: los quitamos para que no
// aparezcan como cuadraditos rotos.
function stripEmoji(s: string) {
  return s.replace(/[\p{Extended_Pictographic}️‍]/gu, "").replace(/\s{2,}/g, " ");
}

// Carga un asset público como data URL (para embeberlo en el PDF).
async function loadDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// --- Inline: **negrita**, `código`, [texto](url) -> runs de pdfmake ---
function inlineRuns(input: string): any {
  const text = stripEmoji(input);
  const runs: any[] = [];
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) });
    if (m[2] != null) runs.push({ text: m[2], bold: true });
    else if (m[4] != null) runs.push({ text: m[4], style: "code" });
    else if (m[6] != null)
      runs.push({ text: m[6], link: m[7], color: "#9A7B32", decoration: "underline" });
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  if (runs.length === 0) return text;
  if (runs.length === 1 && !runs[0].bold && !runs[0].style && !runs[0].link)
    return runs[0].text;
  return runs;
}

function cells(row: string) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

// --- Markdown -> nodos de contenido pdfmake ---
function mdToPdf(md: string): any[] {
  const lines = md.split(/\r?\n/);
  const out: any[] = [];
  let i = 0;
  let listBuf: any[] | null = null;
  let listType: "ul" | "ol" | null = null;
  const flushList = () => {
    if (listBuf && listType) {
      out.push({ [listType]: listBuf, style: "p", margin: [0, 2, 0, 6] });
    }
    listBuf = null;
    listType = null;
  };

  while (i < lines.length) {
    const t = lines[i].trim();

    // Tabla
    if (
      t.startsWith("|") &&
      i + 1 < lines.length &&
      /^[\s|:-]+$/.test(lines[i + 1].trim()) &&
      lines[i + 1].includes("-")
    ) {
      flushList();
      const header = cells(t).map((c) => ({ text: inlineRuns(c), style: "th" }));
      const body: any[] = [header];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        body.push(cells(lines[i]).map((c) => ({ text: inlineRuns(c), style: "tableCell" })));
        i++;
      }
      out.push({
        table: { headerRows: 1, widths: header.map(() => "*"), body },
        layout: "lightHorizontalLines",
        margin: [0, 6, 0, 8],
      });
      continue;
    }

    if (t === "") {
      flushList();
      i++;
      continue;
    }
    if (t.startsWith("### ")) {
      flushList();
      out.push({ text: inlineRuns(t.slice(4)), style: "h3" });
    } else if (t.startsWith("## ")) {
      flushList();
      out.push({ text: inlineRuns(t.slice(3)), style: "h2" });
    } else if (t.startsWith("# ")) {
      flushList();
      out.push({ text: inlineRuns(t.slice(2)), style: "h2" });
    } else if (t.startsWith("> ")) {
      flushList();
      out.push({
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: inlineRuns(t.slice(2)),
                style: "quote",
                fillColor: "#FBF6E9",
                margin: [12, 8, 12, 8],
                border: [false, false, false, false],
              },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 8, 0, 8],
      });
    } else if (/^(-{3,}|\*{3,})$/.test(t)) {
      flushList();
      out.push({
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#e5e7eb" },
        ],
        margin: [0, 6, 0, 6],
      });
    } else if (/^[-*]\s+/.test(t)) {
      if (listType !== "ul") {
        flushList();
        listBuf = [];
        listType = "ul";
      }
      listBuf!.push(inlineRuns(t.replace(/^[-*]\s+/, "")));
    } else if (/^\d+\.\s+/.test(t)) {
      if (listType !== "ol") {
        flushList();
        listBuf = [];
        listType = "ol";
      }
      listBuf!.push(inlineRuns(t.replace(/^\d+\.\s+/, "")));
    } else {
      flushList();
      out.push({ text: inlineRuns(t), style: "p" });
    }
    i++;
  }
  flushList();
  return out;
}

function safeFilename(s: string) {
  return (
    s
      .replace(/[^\p{L}\p{N}\s._-]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "conversacion"
  );
}

export async function exportChatToPdf(
  messages: Msg[],
  opts: { title: string; you: string; dateStr: string },
) {
  const clean = messages.filter((m) => m.content.trim());
  const logo = await loadDataUrl("/brand/brandon-network-navy.png");

  // Portada
  const content: any[] = [
    logo
      ? { image: logo, width: 150, margin: [0, 0, 0, 6] }
      : { text: "Brandon Latam Network", style: "brand" },
    { text: `${stripEmoji(opts.title)} · ${opts.dateStr}`, style: "meta" },
    {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: "#C2A15B" },
      ],
      margin: [0, 8, 0, 18],
    },
  ];

  for (const m of clean) {
    if (m.role === "user") {
      content.push({
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  { text: opts.you.toUpperCase(), style: "whoDark" },
                  {
                    text: stripEmoji(m.content),
                    color: "#F6F3EC",
                    fontSize: 10.5,
                    margin: [0, 3, 0, 0],
                  },
                ],
                fillColor: "#0B1B2E",
                margin: [14, 11, 14, 12],
                border: [false, false, false, false],
              },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 10, 0, 4],
      });
    } else {
      content.push({ text: "BRANDON LATAM NETWORK", style: "who" });
      content.push(...mdToPdf(m.content));
    }
  }

  const docDefinition: any = {
    info: { title: stripEmoji(opts.title) },
    pageSize: "A4",
    pageMargins: [48, logo ? 64 : 44, 48, 58],
    // Logo + línea dorada arriba de las páginas interiores (la 1 ya tiene portada)
    header: (currentPage: number) =>
      currentPage === 1 || !logo
        ? undefined
        : {
            margin: [48, 20, 48, 0],
            stack: [
              { image: logo, width: 104 },
              {
                canvas: [
                  { type: "line", x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 0.5, lineColor: "#C2A15B" },
                ],
              },
            ],
          },
    // Pie con marca y número de página en todas
    footer: (currentPage: number, pageCount: number) => ({
      margin: [48, 0, 48, 18],
      stack: [
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#C2A15B" },
          ],
        },
        {
          columns: [
            { text: "Brandon Latam Network", fontSize: 8, color: "#9A7B32", margin: [0, 6, 0, 0] },
            {
              text: `${currentPage} / ${pageCount}`,
              alignment: "right",
              fontSize: 8,
              color: "#9ca3af",
              margin: [0, 6, 0, 0],
            },
          ],
        },
      ],
    }),
    content,
    defaultStyle: { font: "Roboto", fontSize: 10.5, color: "#11243B", lineHeight: 1.35 },
    styles: {
      brand: { fontSize: 20, bold: true, color: "#0B1B2E" },
      meta: { fontSize: 9, color: "#6b7280", margin: [0, 3, 0, 0] },
      who: { fontSize: 8, bold: true, color: "#9A7B32", margin: [0, 12, 0, 4] },
      whoDark: { fontSize: 8, color: "#8b93a1" },
      h2: { fontSize: 14, bold: true, color: "#0B1B2E", margin: [0, 12, 0, 5] },
      h3: { fontSize: 12, bold: true, color: "#9A7B32", margin: [0, 9, 0, 3] },
      p: { fontSize: 10.5, margin: [0, 4, 0, 4] },
      code: { fontSize: 9.5, color: "#9A7B32" },
      quote: { fontSize: 10.5, color: "#5b4a22" },
      tableCell: { fontSize: 9.5 },
      th: { fontSize: 9.5, bold: true, fillColor: "#0B1B2E", color: "#F6F3EC" },
    },
  };

  const [pdfMakeMod, vfsMod] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const pdfMake: any = (pdfMakeMod as any).default ?? pdfMakeMod;
  const vfs: any = (vfsMod as any).default ?? vfsMod;

  if (typeof pdfMake.addVirtualFileSystem === "function") pdfMake.addVirtualFileSystem(vfs);
  else pdfMake.vfs = vfs;
  pdfMake.fonts = {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  };

  pdfMake.createPdf(docDefinition).download(`${safeFilename(opts.title)}.pdf`);
}
