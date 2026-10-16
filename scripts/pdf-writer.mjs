// A tiny PDF writer for the printable worksheets (A4, Helvetica, plain text, lines and
// tables). Used by scripts/make-pdfs.mjs and scripts/make-worksheets.mjs.
// Text must be plain (Latin-1): no curly quotes or long dashes.
//
// Blocks: { title }, { subtitle }, { heading }, { text }, { question } (numbered, with
// writing lines: `lines`), { table: { columns: [[label, width]], rows } }, { pageBreak }.

const PAGE_TOP = 790, PAGE_BOTTOM = 60, LEFT = 55, RIGHT = 540;

function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

export function makePdf(blocks, footer = "The Habit Lab  -  David Ernest Cornwell") {
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const pages = [[]];
  let y = PAGE_TOP;
  const newPage = () => { pages.push([]); y = PAGE_TOP; };
  const need = (h) => { if (y - h < PAGE_BOTTOM) newPage(); };
  const text = (t, font, size, x = LEFT) => pages.at(-1).push(`BT /${font} ${size} Tf ${x} ${y} Td (${esc(t)}) Tj ET`);
  const line = (x1, y1, x2, y2, grey = 0.8) => pages.at(-1).push(`${grey} ${grey} ${grey} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  let n = 0;

  for (const b of blocks) {
    if (b.pageBreak) { newPage(); continue; }
    if (b.title) { need(40); text(b.title, "F2", 22); y -= 30; }
    if (b.subtitle) { need(24); text(b.subtitle, "F1", 12); y -= 26; }
    if (b.heading) { need(60); y -= 6; text(b.heading, "F2", 15); y -= 24; }
    if (b.text) {
      for (const t of wrap(b.text, 92)) { need(15); text(t, "F1", 10.5); y -= 15; }
      y -= 10;
    }
    if (b.question) {
      const qLines = wrap(`${++n}. ${b.question}`, 86);
      need(qLines.length * 15 + 22 * (b.lines ?? 4));
      for (const t of qLines) { text(t, "F2", 10.5); y -= 15; }
      for (let k = 0; k < (b.lines ?? 4); k++) { y -= 22; line(LEFT, y, RIGHT, y); }
      y -= 18;
    }
    if (b.table) {
      const { columns, rows = 8 } = b.table;
      const rowH = 26, headH = 30; // the heading row has room for two lines
      need(headH + rowH * rows + 10);
      const top = y + 10;
      let x = LEFT;
      columns.forEach(([label, w]) => {
        wrap(label, Math.floor(w / 5)).slice(0, 2).forEach((t, i) => {
          pages.at(-1).push(`BT /F2 8.5 Tf ${x + 4} ${top - 11 - i * 10} Td (${esc(t)}) Tj ET`);
        });
        x += w;
      });
      // the heading row, then empty rows to write in
      const bottom = top - headH - rowH * rows;
      line(LEFT, top, x, top, 0.75);
      for (let r = 0; r <= rows; r++) line(LEFT, top - headH - r * rowH, x, top - headH - r * rowH, r === 0 ? 0.45 : 0.75);
      let cx = LEFT;
      line(cx, top, cx, bottom);
      columns.forEach(([, w]) => { cx += w; line(cx, top, cx, bottom); });
      y = bottom - 18;
    }
  }
  for (const p of pages) {
    p.push(`BT /F1 8 Tf ${LEFT} 32 Td (${esc(footer)}) Tj ET`);
  }

  const objects = [];
  const add = (body) => objects.push(body) && objects.length;
  const catalog = add(null), pagesObj = add(null);
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids = pages.map((ops) => {
    const stream = "0.6 w 0.18 0.23 0.25 rg\n" + ops.join("\n");
    const content = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    return add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`);
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;

  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const offset = Buffer.byteLength(out, "latin1");
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
