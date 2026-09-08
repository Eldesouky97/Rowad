'use client';

/**
 * يبني ملف CSV (بترميز UTF-8 + BOM عشان يفتح صح بالعربي في Excel مباشرة)
 * وينزّله على جهاز المستخدم — بديل خفيف عن مكتبة xlsx كاملة، وExcel بيفتح
 * ملفات .csv تلقائيًا كجدول منسّق زي أي ملف إكسل عادي.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (cell: string | number) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n');

  const BOM = '﻿';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
