import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import { parsePageRange } from './documentEngine';

/**
 * 1. Merge multiple PDF files into one single PDF document
 */
export async function mergePdfFiles(
  files: File[],
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  if (files.length === 0) throw new Error('Pilih minimal 1 file PDF untuk digabungkan.');
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const pct = Math.round(((i + 1) / files.length) * 85);
    onProgress?.(pct, `Menggabungkan ${file.name} (${i + 1}/${files.length})...`);

    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  onProgress?.(95, 'Menyimpan dokumen PDF gabungan...');
  const mergedBytes = await mergedPdf.save();
  return new Blob([mergedBytes], { type: 'application/pdf' });
}

/**
 * 2. Split a PDF file by page range OR burst all pages into a ZIP archive
 */
export async function splitPdfFile(
  file: File,
  pageRangeStr: string,
  burstToZip: boolean,
  onProgress?: (pct: number, msg?: string) => void
): Promise<{ blob: Blob; ext: 'pdf' | 'zip' }> {
  onProgress?.(15, 'Membaca halaman PDF...');
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  const selectedPages = parsePageRange(pageRangeStr, totalPages);

  if (!burstToZip) {
    onProgress?.(55, `Mengekstrak ${selectedPages.length} halaman pilihan...`);
    const outPdf = await PDFDocument.create();
    const zeroBased = selectedPages.map((p) => p - 1);
    const copied = await outPdf.copyPages(srcPdf, zeroBased);
    copied.forEach((p) => outPdf.addPage(p));
    const bytes = await outPdf.save();
    return { blob: new Blob([bytes], { type: 'application/pdf' }), ext: 'pdf' };
  }

  const zip = new JSZip();
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  for (let i = 0; i < selectedPages.length; i++) {
    const pageNum = selectedPages[i];
    onProgress?.(
      20 + Math.round(((i + 1) / selectedPages.length) * 70),
      `Memisahkan halaman ${pageNum} dari ${totalPages}...`
    );
    const singlePdf = await PDFDocument.create();
    const [copiedPage] = await singlePdf.copyPages(srcPdf, [pageNum - 1]);
    singlePdf.addPage(copiedPage);
    const singleBytes = await singlePdf.save();
    zip.file(`${baseName}_halaman_${pageNum}.pdf`, singleBytes);
  }

  onProgress?.(95, 'Membuat paket ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { blob: zipBlob, ext: 'zip' };
}

/**
 * 3. Compress a PDF file (re-optimizes page streams & images at selected compression level)
 */
export async function compressPdfFile(
  file: File,
  level: 'light' | 'recommended' | 'extreme',
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  onProgress?.(10, 'Menganalisis ukuran halaman PDF...');
  const arrayBuffer = await file.arrayBuffer();

  const scaleMap = { light: 1.75, recommended: 1.35, extreme: 1.0 };
  const qualityMap = { light: 0.82, recommended: 0.65, extreme: 0.45 };
  const scale = scaleMap[level];
  const jpegQuality = qualityMap[level];

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const outPdf = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(
      15 + Math.round((pageNum / pdf.numPages) * 75),
      `Mengompresi halaman ${pageNum} dari ${pdf.numPages}...`
    );
    const page = await pdf.getPage(pageNum);
    const origViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(renderViewport.width);
    canvas.height = Math.round(renderViewport.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
    const jpgBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal kompresi halaman'))), 'image/jpeg', jpegQuality)
    );
    const jpgBytes = await jpgBlob.arrayBuffer();
    const embeddedJpg = await outPdf.embedJpg(jpgBytes);
    const pdfPage = outPdf.addPage([origViewport.width, origViewport.height]);
    pdfPage.drawImage(embeddedJpg, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });
  }

  onProgress?.(95, 'Menyimpan PDF terkompresi...');
  const outBytes = await outPdf.save({ useObjectStreams: true });
  return new Blob([outBytes], { type: 'application/pdf' });
}

/**
 * 4. Combine multiple images (JPG/PNG/WebP) into a single multi-page PDF document
 */
export async function imagesToSinglePdf(
  files: File[],
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  if (files.length === 0) throw new Error('Pilih minimal 1 gambar.');
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(
      10 + Math.round(((i + 1) / files.length) * 80),
      `Menambahkan gambar ${file.name} (${i + 1}/${files.length})...`
    );

    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error(`Gagal membaca gambar ${file.name}`));
        el.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const jpgBlob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal konversi gambar'))), 'image/jpeg', 0.92)
      );
      const jpgBytes = await jpgBlob.arrayBuffer();
      const embedded = await pdfDoc.embedJpg(jpgBytes);
      const page = pdfDoc.addPage([canvas.width, canvas.height]);
      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  onProgress?.(95, 'Menyimpan PDF...');
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * 5. Stamp a diagonal watermark text across all pages of a PDF
 */
export async function watermarkPdfFile(
  file: File,
  watermarkText: string,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  onProgress?.(20, 'Membaca dokumen PDF...');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const text = watermarkText.trim() || 'MYCONVERT CONFIDENTIAL';

  pages.forEach((page, idx) => {
    onProgress?.(30 + Math.round(((idx + 1) / pages.length) * 60), `Menambahkan watermark halaman ${idx + 1}...`);
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 10;
    page.drawText(text, {
      x: width * 0.18,
      y: height * 0.35,
      size: fontSize,
      font,
      color: rgb(0.45, 0.45, 0.55),
      opacity: 0.22,
      rotate: degrees(35),
    });
  });

  const outBytes = await pdfDoc.save();
  return new Blob([outBytes], { type: 'application/pdf' });
}
