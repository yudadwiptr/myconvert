import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { ConversionSettings } from '../types/converter';

// Configure PDF.js worker using local Vite bundled worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

interface ExtractedPdfPage {
  pageNumber: number;
  width: number;
  height: number;
  rows: ExtractedTextItem[][];
  lines: string[];
  imageDataUrl?: string;
  imageArrayBuffer?: ArrayBuffer;
}

/**
 * Parses a page range string like "1-3, 5" or "all" into an array of 1-based page numbers
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const clean = (rangeStr || 'all').trim().toLowerCase();
  if (!clean || clean === 'all' || clean === '*') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  const parts = clean.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let p = start; p <= end; p++) pages.add(p);
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num);
      }
    }
  }
  const result = Array.from(pages).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
}

/**
 * Extracts structured text lines, table rows/columns, and optional high-DPI page renders from a PDF
 */
async function extractPdfPages(
  file: File,
  settings: ConversionSettings,
  needImages: boolean,
  imageMime: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
  onProgress?: (pct: number, msg?: string) => void
): Promise<ExtractedPdfPage[]> {
  onProgress?.(10, 'Membaca dokumen PDF...');
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const targetPages = parsePageRange(settings.pageRange, pdf.numPages);
  const extractedPages: ExtractedPdfPage[] = [];
  const scale = settings.pdfDpiScale || 2;
  const qualityFloat = Math.min(1, Math.max(0.2, (settings.quality || 90) / 100));

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    const progressPct = 15 + Math.round(((idx + 1) / targetPages.length) * 60);
    onProgress?.(progressPct, `Mengekstrak halaman PDF ${pageNum} dari ${pdf.numPages}...`);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items: ExtractedTextItem[] = [];
    for (const rawItem of textContent.items) {
      if ('str' in rawItem && rawItem.str.trim().length > 0) {
        const tx = rawItem.transform;
        const x = tx[4];
        const y = viewport.height - tx[5]; // Top-down Y coordinate
        const fontSize = Math.round(Math.hypot(tx[0], tx[1]) || 12);
        items.push({
          str: rawItem.str,
          x,
          y,
          width: rawItem.width || 0,
          height: rawItem.height || fontSize,
          fontSize,
        });
      }
    }

    // Group items into horizontal rows by Y coordinate tolerance
    items.sort((a, b) => (Math.abs(a.y - b.y) <= 5 ? a.x - b.x : a.y - b.y));
    const rows: ExtractedTextItem[][] = [];
    for (const item of items) {
      const lastRow = rows[rows.length - 1];
      if (!lastRow || Math.abs(lastRow[0].y - item.y) > 5.5) {
        rows.push([item]);
      } else {
        lastRow.push(item);
      }
    }

    const lines = rows.map((row) => {
      row.sort((a, b) => a.x - b.x);
      let lineStr = '';
      let prevEnd = -1;
      for (const cell of row) {
        if (prevEnd >= 0 && cell.x - prevEnd > 14) {
          lineStr += '   ';
        } else if (prevEnd >= 0 && cell.x - prevEnd > 2) {
          lineStr += ' ';
        }
        lineStr += cell.str;
        prevEnd = cell.x + cell.width;
      }
      return lineStr.trim();
    });

    let imageDataUrl: string | undefined;
    let imageArrayBuffer: ArrayBuffer | undefined;

    if (needImages) {
      const renderViewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(renderViewport.width);
      canvas.height = Math.round(renderViewport.height);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
      imageDataUrl = canvas.toDataURL(imageMime, qualityFloat);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal merender halaman PDF'))), imageMime, qualityFloat)
      );
      imageArrayBuffer = await blob.arrayBuffer();
    }

    extractedPages.push({
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      rows,
      lines,
      imageDataUrl,
      imageArrayBuffer,
    });
  }

  return extractedPages;
}

/**
 * Convert PDF -> Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Images, HTML, Markdown, TXT, CSV, JSON
 */
export async function convertPdfFile(
  file: File,
  targetExt: string,
  settings: ConversionSettings,
  onProgress?: (pct: number, msg?: string) => void
): Promise<{ blob: Blob; finalExt: string }> {
  const ext = targetExt.toLowerCase();

  // 1. PDF -> Word (.docx)
  if (ext === 'docx') {
    const mode = settings.pdfToWordMode || 'hybrid';
    const needPageImages = mode === 'visual' || mode === 'hybrid';
    const pages = await extractPdfPages(file, settings, needPageImages, 'image/png', onProgress);

    onProgress?.(82, 'Menyusun dokumen Microsoft Word (.docx)...');
    const children: (Paragraph | Table)[] = [];

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];

      if (mode === 'editable' || mode === 'hybrid') {
        for (const row of p.rows) {
          row.sort((a, b) => a.x - b.x);
          const avgFontSize = row.reduce((acc, it) => acc + it.fontSize, 0) / (row.length || 1);
          const lineText = row.map((it) => it.str).join(' ').trim();
          if (!lineText) continue;

          const isHeading = avgFontSize >= 16;
          children.push(
            new Paragraph({
              heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
              spacing: { after: 140 },
              children: [
                new TextRun({
                  text: lineText,
                  bold: isHeading,
                  size: Math.max(18, Math.min(44, Math.round(avgFontSize * 2))),
                  font: 'Calibri',
                }),
              ],
            })
          );
        }
      }

      // If visual mode or hybrid (when page has diagrams or very few text items), embed crisp page render
      if (
        p.imageArrayBuffer &&
        (mode === 'visual' || (mode === 'hybrid' && p.rows.length < 5))
      ) {
        const docWidth = 580;
        const aspect = p.height / (p.width || 1);
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 200 },
            children: [
              new ImageRun({
                data: p.imageArrayBuffer,
                transformation: {
                  width: docWidth,
                  height: Math.round(docWidth * aspect),
                },
                type: 'png',
              }),
            ],
          })
        );
      }

      if (i < pages.length - 1) {
        children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
      }
    }

    const doc = new Document({
      sections: [{ children: children.length > 0 ? children : [new Paragraph('Dokumen kosong')] }],
    });
    const blob = await Packer.toBlob(doc);
    return { blob, finalExt: 'docx' };
  }

  // 2. PDF -> Excel (.xlsx / .csv)
  if (ext === 'xlsx' || ext === 'csv') {
    const pages = await extractPdfPages(file, settings, false, 'image/png', onProgress);
    onProgress?.(82, 'Menyusun tabel Microsoft Excel (.xlsx)...');

    const wb = XLSX.utils.book_new();
    const combinedAoA: string[][] = [];

    for (const p of pages) {
      const sheetAoA: string[][] = [];
      for (const row of p.rows) {
        row.sort((a, b) => a.x - b.x);
        // Group items that are close horizontally into a single cell, separate distant items into columns
        const cells: string[] = [];
        let curCell = '';
        let prevEnd = -1;
        for (const item of row) {
          if (prevEnd >= 0 && item.x - prevEnd > 16) {
            cells.push(curCell.trim());
            curCell = item.str;
          } else {
            curCell += (curCell ? ' ' : '') + item.str;
          }
          prevEnd = item.x + item.width;
        }
        if (curCell.trim()) cells.push(curCell.trim());
        if (cells.length > 0) {
          sheetAoA.push(cells);
          combinedAoA.push([`Halaman ${p.pageNumber}`, ...cells]);
        }
      }
      const ws = XLSX.utils.aoa_to_sheet(sheetAoA.length > 0 ? sheetAoA : [['(Tidak ada teks di halaman ini)']]);
      XLSX.utils.book_append_sheet(wb, ws, `Halaman ${p.pageNumber}`.slice(0, 31));
    }

    if (pages.length > 1) {
      const allWs = XLSX.utils.aoa_to_sheet([['Halaman', 'Data Kolom 1', 'Data Kolom 2', 'Data Kolom 3'], ...combinedAoA]);
      XLSX.utils.book_append_sheet(wb, allWs, 'Semua Data');
    }

    if (ext === 'csv') {
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const csvText = XLSX.utils.sheet_to_csv(firstSheet);
      return {
        blob: new Blob([csvText], { type: 'text/csv;charset=utf-8' }),
        finalExt: 'csv',
      };
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return {
      blob: new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      finalExt: 'xlsx',
    };
  }

  // 3. PDF -> PowerPoint (.pptx)
  if (ext === 'pptx') {
    const pages = await extractPdfPages(file, settings, true, 'image/png', onProgress);
    onProgress?.(85, 'Menyusun slide presentasi PowerPoint (.pptx)...');

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    for (const p of pages) {
      const slide = pptx.addSlide();
      if (p.imageDataUrl) {
        slide.addImage({
          data: p.imageDataUrl,
          x: 0.3,
          y: 0.25,
          w: 9.4,
          h: 5.1,
          sizing: { type: 'contain', w: 9.4, h: 5.1 },
        });
      }
      if (p.lines.length > 0) {
        slide.addNotes(p.lines.join('\n'));
      }
    }

    const out = (await pptx.write({ outputType: 'blob' })) as Blob;
    return { blob: out, finalExt: 'pptx' };
  }

  // 4. PDF -> Images (PNG, JPG, WEBP)
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const pages = await extractPdfPages(file, settings, true, mime, onProgress);

    if (pages.length === 1 && pages[0].imageArrayBuffer) {
      return {
        blob: new Blob([pages[0].imageArrayBuffer], { type: mime }),
        finalExt: ext,
      };
    }

    onProgress?.(88, `Mengemas ${pages.length} halaman gambar ke dalam ZIP...`);
    const zip = new JSZip();
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    for (const p of pages) {
      if (p.imageArrayBuffer) {
        zip.file(`${baseName}_halaman_${p.pageNumber}.${ext}`, p.imageArrayBuffer);
      }
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { blob: zipBlob, finalExt: 'zip' };
  }

  // 5. PDF -> TXT / MD / HTML / JSON
  const pages = await extractPdfPages(file, settings, false, 'image/png', onProgress);

  if (ext === 'txt') {
    const text = pages
      .map((p) => `=== HALAMAN ${p.pageNumber} ===\n${p.lines.join('\n')}`)
      .join('\n\n');
    return {
      blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
      finalExt: 'txt',
    };
  }

  if (ext === 'md') {
    const md = pages
      .map((p) => `## Halaman ${p.pageNumber}\n\n${p.lines.join('\n\n')}`)
      .join('\n\n---\n\n');
    return {
      blob: new Blob([md], { type: 'text/markdown;charset=utf-8' }),
      finalExt: 'md',
    };
  }

  if (ext === 'html') {
    const htmlBody = pages
      .map(
        (p) =>
          `<section class="page"><h2>Halaman ${p.pageNumber}</h2>${p.lines
            .map((l) => `<p>${l.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
            .join('')}</section>`
      )
      .join('\n');
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${file.name} - Converted by MyConvert</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 840px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1e293b; background: #f8fafc; }
  .page { background: #fff; padding: 2rem; margin-bottom: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  h2 { color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-top: 0; }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;
    return {
      blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
      finalExt: 'html',
    };
  }

  if (ext === 'json') {
    const json = JSON.stringify(
      {
        fileName: file.name,
        totalPages: pages.length,
        pages: pages.map((p) => ({
          pageNumber: p.pageNumber,
          lines: p.lines,
        })),
      },
      null,
      2
    );
    return {
      blob: new Blob([json], { type: 'application/json;charset=utf-8' }),
      finalExt: 'json',
    };
  }

  throw new Error(`Konversi PDF ke .${ext} belum didukung.`);
}

/**
 * Helper to render multi-line text cleanly into a multi-page PDF via jsPDF
 */
export function renderTextToPdfBlob(title: string, textContent: string, orientation: 'portrait' | 'landscape' = 'portrait'): Blob {
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const usableWidth = pageWidth - margin * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, margin, margin);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);

  const lines = doc.splitTextToSize(textContent || '(Dokumen kosong)', usableWidth);
  let y = margin + 26;
  const lineHeight = 15;

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(String(line), margin, y);
    y += lineHeight;
  }

  return doc.output('blob');
}

/**
 * Convert Word (.docx / .doc / .rtf) -> PDF, HTML, TXT, Markdown, JSON
 */
export async function convertWordFile(
  file: File,
  targetExt: string,
  settings: ConversionSettings,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  onProgress?.(20, 'Membaca struktur dokumen Word...');
  const arrayBuffer = await file.arrayBuffer();

  let rawText = '';
  let htmlContent = '';

  try {
    const [textRes, htmlRes] = await Promise.all([
      mammoth.extractRawText({ arrayBuffer }),
      mammoth.convertToHtml({ arrayBuffer }),
    ]);
    rawText = textRes.value || '';
    htmlContent = htmlRes.value || '';
  } catch {
    // Fallback for plain text or legacy RTF/DOC
    rawText = await file.text();
    htmlContent = `<pre>${rawText.replace(/</g, '&lt;')}</pre>`;
  }

  onProgress?.(70, `Menyusun file .${targetExt.toUpperCase()}...`);
  const ext = targetExt.toLowerCase();

  if (ext === 'pdf') {
    const title = file.name.replace(/\.[^/.]+$/, '');
    return renderTextToPdfBlob(title, rawText, settings.pdfOrientation);
  }

  if (ext === 'txt') {
    return new Blob([rawText], { type: 'text/plain;charset=utf-8' });
  }

  if (ext === 'md') {
    const md = htmlContent
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, '');
    return new Blob([md.trim() || rawText], { type: 'text/markdown;charset=utf-8' });
  }

  if (ext === 'html') {
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${file.name}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 820px; margin: 2.5rem auto; padding: 0 1.25rem; line-height: 1.65; color: #0f172a; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  td, th { border: 1px solid #cbd5e1; padding: 8px 12px; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
    return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  }

  if (ext === 'json') {
    const paragraphs = rawText
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    return new Blob([JSON.stringify({ fileName: file.name, paragraphs }, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
  }

  if (ext === 'docx') {
    const lines = rawText.split(/\r?\n/);
    const doc = new Document({
      sections: [
        {
          children: lines.map((line) => new Paragraph({ children: [new TextRun(line)] })),
        },
      ],
    });
    return await Packer.toBlob(doc);
  }

  throw new Error(`Konversi Word ke .${ext} belum didukung.`);
}

/**
 * Convert Spreadsheet (.xlsx / .xls / .csv / .ods) -> PDF, XLSX, CSV, JSON, HTML, MD, XML, SQL, TXT
 */
export async function convertSpreadsheetFile(
  file: File,
  targetExt: string,
  settings: ConversionSettings,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  onProgress?.(20, 'Membaca data spreadsheet...');
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const firstSheet = wb.Sheets[firstSheetName];

  onProgress?.(65, `Mengonversi tabel ke format .${targetExt.toUpperCase()}...`);
  const ext = targetExt.toLowerCase();

  if (ext === 'xlsx') {
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  if (ext === 'csv' || ext === 'txt') {
    const csv = XLSX.utils.sheet_to_csv(firstSheet);
    return new Blob([csv], {
      type: ext === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8',
    });
  }

  if (ext === 'json') {
    const result: Record<string, unknown[]> = {};
    for (const name of wb.SheetNames) {
      result[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
    }
    const payload = wb.SheetNames.length === 1 ? result[firstSheetName] : result;
    return new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
  }

  if (ext === 'html') {
    const tableHtml = XLSX.utils.sheet_to_html(firstSheet);
    return new Blob([tableHtml], { type: 'text/html;charset=utf-8' });
  }

  const rowsAoA = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '' });

  if (ext === 'pdf') {
    const doc = new jsPDF({
      orientation: settings.pdfOrientation === 'portrait' ? 'portrait' : 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    for (let i = 0; i < wb.SheetNames.length; i++) {
      const sName = wb.SheetNames[i];
      const sheetRows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sName], { header: 1, defval: '' });
      if (i > 0) doc.addPage();
      doc.setFontSize(13);
      doc.text(`${file.name} — ${sName}`, 40, 35);

      const head = sheetRows.length > 0 ? [sheetRows[0].map(String)] : [['Data']];
      const body = sheetRows.slice(1).map((r) => r.map(String));

      autoTable(doc, {
        startY: 48,
        head,
        body,
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    return doc.output('blob');
  }

  if (ext === 'md') {
    if (rowsAoA.length === 0) {
      return new Blob(['*(Tabel kosong)*'], { type: 'text/markdown;charset=utf-8' });
    }
    const header = rowsAoA[0].map((c) => String(c || ' ').replace(/\|/g, '\\|'));
    const divider = header.map(() => '---');
    const body = rowsAoA
      .slice(1)
      .map((r) => `| ${header.map((_, idx) => String(r[idx] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`);
    const md = [
      `| ${header.join(' | ')} |`,
      `| ${divider.join(' | ')} |`,
      ...body,
    ].join('\n');
    return new Blob([md], { type: 'text/markdown;charset=utf-8' });
  }

  if (ext === 'xml') {
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
    const xmlItems = jsonRows
      .map((row) => {
        const fields = Object.entries(row)
          .map(([k, v]) => {
            const tag = k.replace(/[^a-zA-Z0-9_]/g, '_') || 'field';
            const val = String(v ?? '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            return `    <${tag}>${val}</${tag}>`;
          })
          .join('\n');
        return `  <row>\n${fields}\n  </row>`;
      })
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n${xmlItems}\n</dataset>`;
    return new Blob([xml], { type: 'application/xml;charset=utf-8' });
  }

  if (ext === 'sql') {
    const tableName =
      file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase() || 'myconvert_table';
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
    if (jsonRows.length === 0) {
      return new Blob([`-- Tabel kosong: ${tableName}`], { type: 'application/sql;charset=utf-8' });
    }
    const cols = Object.keys(jsonRows[0]).map((c) => c.replace(/[^a-zA-Z0-9_]/g, '_') || 'col');
    const createStmt = `CREATE TABLE ${tableName} (\n  ${cols.map((c) => `${c} TEXT`).join(',\n  ')}\n);\n\n`;
    const inserts = jsonRows
      .map((row) => {
        const vals = Object.values(row).map((v) => `'${String(v ?? '').replace(/'/g, "''")}'`);
        return `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals.join(', ')});`;
      })
      .join('\n');
    return new Blob([createStmt + inserts], { type: 'application/sql;charset=utf-8' });
  }

  throw new Error(`Konversi Spreadsheet ke .${ext} belum didukung.`);
}

/**
 * Convert PowerPoint (.pptx / .ppt) -> PDF, HTML, TXT, Markdown, JSON
 */
export async function convertPresentationFile(
  file: File,
  targetExt: string,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  onProgress?.(20, 'Membaca paket slide PowerPoint (.pptx)...');
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

  const slides: { slideNumber: number; paragraphs: string[] }[] = [];
  for (let i = 0; i < slideFiles.length; i++) {
    onProgress?.(30 + Math.round(((i + 1) / Math.max(1, slideFiles.length)) * 45), `Mengekstrak Slide ${i + 1}...`);
    const xmlStr = await zip.files[slideFiles[i]].async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
    const pNodes = Array.from(xmlDoc.getElementsByTagName('a:p'));
    const paragraphs: string[] = [];

    for (const pNode of pNodes) {
      const tNodes = Array.from(pNode.getElementsByTagName('a:t'));
      const line = tNodes.map((n) => n.textContent || '').join('').trim();
      if (line) paragraphs.push(line);
    }

    slides.push({
      slideNumber: i + 1,
      paragraphs,
    });
  }

  const ext = targetExt.toLowerCase();

  if (ext === 'pdf') {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    slides.forEach((s, idx) => {
      if (idx > 0) doc.addPage();
      // Slide header bar
      doc.setFillColor(30, 27, 75);
      doc.rect(0, 0, pageW, 56, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Slide ${s.slideNumber} — ${file.name}`, 36, 34);

      doc.setTextColor(15, 23, 42);
      let y = 95;
      s.paragraphs.forEach((para, pIdx) => {
        doc.setFont('helvetica', pIdx === 0 ? 'bold' : 'normal');
        doc.setFontSize(pIdx === 0 ? 18 : 12);
        const lines = doc.splitTextToSize(para, pageW - 72);
        for (const line of lines) {
          if (y > pageH - 40) {
            doc.addPage();
            y = 50;
          }
          doc.text(String(line), 36, y);
          y += pIdx === 0 ? 26 : 18;
        }
        y += 8;
      });
    });

    return doc.output('blob');
  }

  if (ext === 'txt' || ext === 'md') {
    const content = slides
      .map((s) => `## Slide ${s.slideNumber}\n\n${s.paragraphs.map((p) => `- ${p}`).join('\n')}`)
      .join('\n\n---\n\n');
    return new Blob([content], {
      type: ext === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
    });
  }

  if (ext === 'html') {
    const cards = slides
      .map(
        (s) =>
          `<div class="slide"><h3>Slide ${s.slideNumber}</h3>${s.paragraphs
            .map((p, i) => (i === 0 ? `<h2>${p}</h2>` : `<p>${p}</p>`))
            .join('')}</div>`
      )
      .join('\n');
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>${file.name}</title>
<style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;max-width:920px;margin:2rem auto;padding:0 1rem}.slide{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:2rem;margin-bottom:1.5rem}h3{color:#818cf8;margin-top:0}</style>
</head><body>${cards}</body></html>`;
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  if (ext === 'json') {
    return new Blob([JSON.stringify({ fileName: file.name, slides }, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
  }

  throw new Error(`Konversi PPTX ke .${ext} belum didukung.`);
}
