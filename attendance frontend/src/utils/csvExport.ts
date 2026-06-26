export interface CsvColumn<T = any> {
  label: string;
  key: string;
  format?: (val: any, row: T) => string;
}

export function exportToCsv<T = any>(
  filename: string,
  data: T[],
  columns: CsvColumn<T>[]
) {
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    str = str.replace(/"/g, '""');
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      str = `"${str}"`;
    }
    return str;
  };

  const headers = columns.map(c => escapeCsv(c.label)).join(',');
  
  const rows = data.map(item => {
    return columns.map(col => {
      const val = (item as any)[col.key];
      const formatted = col.format ? col.format(val, item) : val;
      return escapeCsv(formatted);
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
