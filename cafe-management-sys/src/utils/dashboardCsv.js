// CSV helpers for report exports (Excel-friendly: BOM + quoted cells).
export const toCsv = (rows = []) =>
  rows
    .map((row) =>
      Object.values(row)
        .map((v) => (v == null || v === '' ? '""' : `"${String(v).replace(/"/g, '""')}"`))
        .join(',')
    )
    .join('\n');

export const downloadCsv = (filename, csv) => {
  if (typeof document === 'undefined') return;
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};