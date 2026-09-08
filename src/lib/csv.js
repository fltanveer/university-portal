function escapeCell(value) {
  if (value == null) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Serialisation is kept separate from the download so the quoting rules — where
 * CSV export usually goes wrong — can be exercised on their own.
 *
 * @param {Array<{key:string,label:string,get?:Function}>} columns
 * @param {Array<object>} rows
 * @returns {string}
 */
export function toCsv(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.get ? c.get(row) : row[c.key])).join(','))
    .join('\n');
  return `${header}\n${body}`;
}

/**
 * @param {string} filename
 * @param {Array<{key:string,label:string,get?:Function}>} columns
 * @param {Array<object>} rows
 */
export function exportCsv(filename, columns, rows) {
  const csv = toCsv(columns, rows);

  // BOM so Excel opens UTF-8 names (Nguyễn, São Paulo) correctly.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return rows.length;
}
