import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { ConversionSettings } from '../types/converter';
import { convertSpreadsheetFile, renderTextToPdfBlob } from './documentEngine';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Simple YAML serializer for JSON objects/arrays
 */
function toYaml(data: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (data === null || data === undefined) return 'null';
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  if (typeof data === 'string') {
    if (data.includes('\n') || data.includes(':') || data.includes('#')) {
      return JSON.stringify(data);
    }
    return data;
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const inner = toYaml(item, indent + 1).trimStart();
          return `${pad}- ${inner}`;
        }
        return `${pad}- ${toYaml(item, indent)}`;
      })
      .join('\n');
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries
      .map(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
          return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
        }
        return `${pad}${k}: ${toYaml(v, indent)}`;
      })
      .join('\n');
  }
  return String(data);
}

/**
 * Simple YAML/XML/JSON parser to normalized array of records
 */
function parseStructuredData(text: string, sourceExt: string): Record<string, unknown>[] {
  const ext = sourceExt.toLowerCase();
  if (ext === 'json') {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === 'object' && item !== null ? item : { value: item }));
    }
    if (typeof parsed === 'object' && parsed !== null) {
      // Find first array property or wrap object
      for (const val of Object.values(parsed)) {
        if (Array.isArray(val)) return val as Record<string, unknown>[];
      }
      return [parsed as Record<string, unknown>];
    }
    return [{ value: parsed }];
  }

  if (ext === 'xml') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'application/xml');
    const root = xmlDoc.documentElement;
    const children = Array.from(root.children);
    if (children.length === 0) return [{ [root.tagName]: root.textContent || '' }];
    return children.map((node) => {
      const obj: Record<string, unknown> = {};
      if (node.children.length === 0) {
        obj[node.tagName] = node.textContent || '';
      } else {
        for (const field of Array.from(node.children)) {
          obj[field.tagName] = field.textContent || '';
        }
      }
      return obj;
    });
  }

  // Fallback key: value parser for YAML
  const lines = text.split(/\r?\n/);
  const records: Record<string, unknown>[] = [];
  let current: Record<string, unknown> = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('- ')) {
      if (Object.keys(current).length > 0) {
        records.push(current);
        current = {};
      }
      const rest = line.slice(2).trim();
      if (rest.includes(':')) {
        const [k, ...v] = rest.split(':');
        current[k.trim()] = v.join(':').trim();
      } else {
        current['item'] = rest;
      }
    } else if (line.includes(':')) {
      const [k, ...v] = line.split(':');
      current[k.trim()] = v.join(':').trim();
    }
  }
  if (Object.keys(current).length > 0) records.push(current);
  return records.length > 0 ? records : [{ content: text }];
}

/**
 * Convert structured Data files (JSON, XML, YAML) or Text/Markdown/HTML
 */
export async function convertDataOrTextFile(
  file: File,
  sourceExt: string,
  targetExt: string,
  settings: ConversionSettings,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  onProgress?.(20, `Membaca konten .${sourceExt.toUpperCase()}...`);
  const text = await file.text();
  const inExt = sourceExt.toLowerCase();
  const outExt = targetExt.toLowerCase();

  // If input is JSON, XML, or YAML -> convert via normalized worksheet
  if (['json', 'xml', 'yaml'].includes(inExt)) {
    const records = parseStructuredData(text, inExt);
    if (outExt === 'yaml') {
      return new Blob([toYaml(records)], { type: 'text/yaml;charset=utf-8' });
    }
    if (outExt === 'json') {
      return new Blob([JSON.stringify(records, null, 2)], { type: 'application/json;charset=utf-8' });
    }

    // Create an in-memory XLSX workbook and reuse convertSpreadsheetFile for XLSX, CSV, PDF, SQL, HTML, MD, XML!
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const xlsxBytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const tempFile = new File([xlsxBytes], file.name.replace(/\.[^/.]+$/, '.xlsx'));
    return await convertSpreadsheetFile(tempFile, outExt, settings, onProgress);
  }

  // Text / Markdown / HTML cross-conversions
  onProgress?.(65, `Menyusun dokumen .${outExt.toUpperCase()}...`);
  const cleanText =
    inExt === 'html'
      ? text
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : text;

  if (outExt === 'pdf') {
    const title = file.name.replace(/\.[^/.]+$/, '');
    return renderTextToPdfBlob(title, cleanText, settings.pdfOrientation);
  }

  if (outExt === 'docx') {
    const lines = cleanText.split(/\r?\n/);
    const doc = new Document({
      sections: [
        {
          children: lines.map((line) => new Paragraph({ children: [new TextRun(line)] })),
        },
      ],
    });
    return await Packer.toBlob(doc);
  }

  if (outExt === 'html') {
    const body =
      inExt === 'md'
        ? text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/\n/gim, '<br/>')
        : `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')}</pre>`;
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>${file.name}</title></head><body style="max-width:800px;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.6">${body}</body></html>`;
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  if (outExt === 'md') {
    return new Blob([cleanText], { type: 'text/markdown;charset=utf-8' });
  }

  if (outExt === 'txt') {
    return new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
  }

  if (outExt === 'rtf') {
    const escaped = cleanText.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/\r?\n/g, '\\par\n');
    const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\\f0\\fs22 ${escaped}}`;
    return new Blob([rtf], { type: 'application/rtf' });
  }

  if (outExt === 'json') {
    const lines = cleanText.split(/\r?\n/).filter(Boolean);
    return new Blob([JSON.stringify({ fileName: file.name, lines }, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
  }

  throw new Error(`Konversi .${inExt} ke .${outExt} belum didukung.`);
}

/**
 * Packages any single file into a compressed .ZIP archive
 */
export async function packageFileToZip(
  file: File,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  onProgress?.(35, 'Mengompresi file ke dalam arsip ZIP...');
  const zip = new JSZip();
  const buffer = await file.arrayBuffer();
  zip.file(file.name, buffer);
  return await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => {
      onProgress?.(35 + Math.round(meta.percent * 0.6), `Mengompresi ZIP (${Math.round(meta.percent)}%)...`);
    }
  );
}
