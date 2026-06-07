export type TableRow = Record<string, string>;

export function parseMarkdownTable(md: string, sectionHeader: string): TableRow[] {
  const sectionStart = md.indexOf(`## ${sectionHeader}`);
  if (sectionStart === -1) return [];

  const afterHeader = md.slice(sectionStart + `## ${sectionHeader}`.length);
  const sectionEnd = afterHeader.search(/^## /m);
  const section = sectionEnd === -1 ? afterHeader : afterHeader.slice(0, sectionEnd);

  const lines = section
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("|"));

  if (lines.length < 2) return [];

  const headers = lines[0]
    .split("|")
    .map(h => h.trim())
    .filter(Boolean);

  return lines
    .slice(2) // skip header + separator
    .map(line => {
      const cells = line.split("|").map(c => c.trim()).filter(Boolean);
      const row: TableRow = {};
      headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
      return row;
    })
    .filter(row => Object.values(row).some(v => v));
}

export function parseSectionText(md: string, sectionHeader: string): string {
  const start = md.indexOf(`## ${sectionHeader}`);
  if (start === -1) return "";
  const after = md.slice(start + `## ${sectionHeader}`.length);
  const end = after.search(/^## /m);
  return (end === -1 ? after : after.slice(0, end)).trim();
}
