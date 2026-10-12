// Builds a CSV file from rows and starts a download.
// columns: [{ label: "Email", value: (row) => row.email }, ...]
export function downloadCsv(filename, rows, columns) {
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.map((c) => escape(c.label)).join(","),
    ...rows.map((row) => columns.map((c) => escape(c.value(row))).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
