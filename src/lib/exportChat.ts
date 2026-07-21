// Exporta una conversación a PDF sin librerías: arma un documento imprimible
// y abre el diálogo de impresión del navegador (Guardar como PDF).

type Msg = { role: "user" | "assistant"; content: string };

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string) {
  let t = esc(s);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>',
  );
  return t;
}

function cells(row: string) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

// Conversión mínima de Markdown a HTML (títulos, negritas, listas, tablas, citas).
function mdToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  let html = "";
  let i = 0;
  let list: "ul" | "ol" | null = null;
  const closeList = () => {
    if (list) {
      html += `</${list}>`;
      list = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    // Tabla
    if (
      t.startsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1].includes("-") &&
      /^[\s|:-]+$/.test(lines[i + 1].trim())
    ) {
      closeList();
      html += "<table><thead><tr>";
      for (const c of cells(t)) html += `<th>${inline(c)}</th>`;
      html += "</tr></thead><tbody>";
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        html += "<tr>";
        for (const c of cells(lines[i])) html += `<td>${inline(c)}</td>`;
        html += "</tr>";
        i++;
      }
      html += "</tbody></table>";
      continue;
    }

    if (t === "") {
      closeList();
      i++;
      continue;
    }
    if (t.startsWith("### ")) {
      closeList();
      html += `<h3>${inline(t.slice(4))}</h3>`;
    } else if (t.startsWith("## ")) {
      closeList();
      html += `<h2>${inline(t.slice(3))}</h2>`;
    } else if (t.startsWith("# ")) {
      closeList();
      html += `<h2>${inline(t.slice(2))}</h2>`;
    } else if (t.startsWith("> ")) {
      closeList();
      html += `<blockquote>${inline(t.slice(2))}</blockquote>`;
    } else if (/^(-{3,}|\*{3,})$/.test(t)) {
      closeList();
      html += "<hr/>";
    } else if (/^[-*]\s+/.test(t)) {
      if (list !== "ul") {
        closeList();
        html += "<ul>";
        list = "ul";
      }
      html += `<li>${inline(t.replace(/^[-*]\s+/, ""))}</li>`;
    } else if (/^\d+\.\s+/.test(t)) {
      if (list !== "ol") {
        closeList();
        html += "<ol>";
        list = "ol";
      }
      html += `<li>${inline(t.replace(/^\d+\.\s+/, ""))}</li>`;
    } else {
      closeList();
      html += `<p>${inline(t)}</p>`;
    }
    i++;
  }
  closeList();
  return html;
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #11243B; max-width: 720px; margin: 0 auto; padding: 40px 28px; line-height: 1.55; }
  .head { border-bottom: 2px solid #C2A15B; padding-bottom: 14px; margin-bottom: 28px; }
  .brand { font-family: Georgia, "Times New Roman", serif; font-size: 26px; color: #0B1B2E; }
  .brand em { color: #9A7B32; font-style: italic; }
  .meta { color: #6b7280; font-size: 12px; margin-top: 4px; }
  .turn { margin: 0 0 22px; page-break-inside: avoid; }
  .who { text-transform: uppercase; letter-spacing: .04em; font-size: 10px; color: #9ca3af; margin-bottom: 6px; }
  .q { background: #0B1B2E; color: #F6F3EC; border-radius: 12px; padding: 12px 16px; font-size: 14px; }
  .q .who { color: rgba(246,243,236,.55); }
  .a { padding: 2px 2px 0; font-size: 14px; }
  .a h2 { font-family: Georgia, serif; font-size: 18px; color: #0B1B2E; margin: 16px 0 6px; }
  .a h3 { font-size: 15px; color: #0B1B2E; margin: 14px 0 4px; }
  .a p { margin: 8px 0; }
  .a ul, .a ol { margin: 8px 0; padding-left: 20px; }
  .a li { margin: 3px 0; }
  .a table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  .a th, .a td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; vertical-align: top; }
  .a th { background: #f3f4f6; }
  .a blockquote { border: 1px solid rgba(194,161,91,.35); background: rgba(194,161,91,.10); border-radius: 10px; padding: 10px 14px; margin: 12px 0; }
  .a code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
  .a a { color: #9A7B32; }
  @media print { body { padding: 0; } }
`;

export function exportChatToPdf(
  messages: Msg[],
  opts: { title: string; you: string; dateStr: string },
) {
  const clean = messages.filter((m) => m.content.trim());
  const turns = clean
    .map((m) =>
      m.role === "user"
        ? `<div class="turn"><div class="who">${esc(opts.you)}</div><div class="q">${esc(
            m.content,
          )}</div></div>`
        : `<div class="turn"><div class="who">Brandon Network</div><div class="a">${mdToHtml(
            m.content,
          )}</div></div>`,
    )
    .join("");

  const doc = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>${esc(
    opts.title,
  )}</title><style>${STYLES}</style></head><body>
    <div class="head">
      <div class="brand">Brandon <em>Network</em></div>
      <div class="meta">${esc(opts.title)} · ${esc(opts.dateStr)}</div>
    </div>
    ${turns}
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(doc);
  w.document.close();
}
