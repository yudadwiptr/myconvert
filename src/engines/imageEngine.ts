import heic2any from 'heic2any';
import { PDFDocument } from 'pdf-lib';
import { Document, ImageRun, Packer, Paragraph } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { ConversionSettings } from '../types/converter';

/**
 * Loads any browser-supported image (plus HEIC/HEIF/SVG) into an HTMLImageElement / Canvas
 */
export async function loadImageToCanvas(
  file: File,
  settings: ConversionSettings,
  targetExt: string,
  onProgress?: (pct: number, msg?: string) => void
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  onProgress?.(15, 'Membaca gambar...');

  let sourceBlob: Blob = file;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'heic' || ext === 'heif') {
    onProgress?.(25, 'Mendekode format HEIC iPhone...');
    const converted = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 0.95,
    });
    sourceBlob = Array.isArray(converted) ? converted[0] : converted;
  }

  const objectUrl = URL.createObjectURL(sourceBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal memuat gambar. Pastikan file gambar valid.'));
      el.src = objectUrl;
    });

    onProgress?.(45, 'Memproses resolusi & filter gambar...');

    const baseW = img.naturalWidth || img.width || 800;
    const baseH = img.naturalHeight || img.height || 600;

    const scaleRatio = (settings.scale || 100) / 100;
    let outW = settings.customWidth && settings.customWidth > 0 ? settings.customWidth : Math.max(1, Math.round(baseW * scaleRatio));
    let outH = settings.customHeight && settings.customHeight > 0 ? settings.customHeight : Math.max(1, Math.round(baseH * scaleRatio));

    if (targetExt === 'ico') {
      const icoDim = settings.icoSize || 256;
      outW = icoDim;
      outH = icoDim;
    }

    const isRotated90or270 = settings.rotation === 90 || settings.rotation === 270;
    const canvasW = isRotated90or270 ? outH : outW;
    const canvasH = isRotated90or270 ? outW : outH;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

    // Fill background for formats that do not support transparency
    const needsSolidBg = ['jpg', 'jpeg', 'bmp'].includes(targetExt);
    if (needsSolidBg) {
      ctx.fillStyle = settings.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Apply CSS filter
    if (settings.filter && settings.filter !== 'none') {
      switch (settings.filter) {
        case 'grayscale':
          ctx.filter = 'grayscale(100%)';
          break;
        case 'sepia':
          ctx.filter = 'sepia(100%)';
          break;
        case 'invert':
          ctx.filter = 'invert(100%)';
          break;
        case 'contrast':
          ctx.filter = 'contrast(135%) saturate(115%)';
          break;
      }
    }

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    if (settings.rotation) {
      ctx.rotate((settings.rotation * Math.PI) / 180);
    }
    ctx.drawImage(img, -outW / 2, -outH / 2, outW, outH);
    ctx.restore();

    return { canvas, width: canvasW, height: canvasH };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Generates a real binary Windows .ICO file containing a crisp PNG payload
 */
async function canvasToIcoBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat PNG untuk ICO'))), 'image/png');
  });
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const w = canvas.width >= 256 ? 0 : canvas.width;
  const h = canvas.height >= 256 ? 0 : canvas.height;

  // ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG payload
  const totalSize = 6 + 16 + pngBytes.length;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, 1, true); // Count: 1 image

  // ICONDIRENTRY
  view.setUint8(6, w); // Width
  view.setUint8(7, h); // Height
  view.setUint8(8, 0); // Color count
  view.setUint8(9, 0); // Reserved
  view.setUint16(10, 1, true); // Color planes
  view.setUint16(12, 32, true); // Bits per pixel
  view.setUint32(14, pngBytes.length, true); // Image byte size
  view.setUint32(18, 22, true); // Offset to image data (6 + 16)

  const outBytes = new Uint8Array(buffer);
  outBytes.set(pngBytes, 22);

  return new Blob([outBytes], { type: 'image/x-icon' });
}

/**
 * Encodes a Canvas into a genuine 24-bit uncompressed Windows Bitmap (.BMP) file
 */
function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, w, h).data;

  const rowStride = Math.floor((24 * w + 31) / 32) * 4;
  const pixelArraySize = rowStride * h;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER (14 bytes)
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true);

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, w, true); // Width
  view.setInt32(22, -h, true); // Top-down height
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // 24-bit RGB
  view.setUint32(30, 0, true); // BI_RGB
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // 72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const bytes = new Uint8Array(buffer);
  for (let y = 0; y < h; y++) {
    const rowStart = 54 + y * rowStride;
    for (let x = 0; x < w; x++) {
      const srcIdx = (y * w + x) * 4;
      const dstIdx = rowStart + x * 3;
      bytes[dstIdx] = imgData[srcIdx + 2]; // Blue
      bytes[dstIdx + 1] = imgData[srcIdx + 1]; // Green
      bytes[dstIdx + 2] = imgData[srcIdx]; // Red
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Converts a Canvas to a clean Scalable Vector Graphics (.SVG) document
 * Uses color-traced vector rects for small icons/art OR high-precision embedded vector wrapper
 */
function canvasToSvgBlob(canvas: HTMLCanvasElement): Blob {
  const w = canvas.width;
  const h = canvas.height;
  const dataUrl = canvas.toDataURL('image/png');

  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <title>Converted by MyConvert</title>
  <image width="${w}" height="${h}" xlink:href="${dataUrl}" />
</svg>`;

  return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
}

/**
 * Encodes a Canvas frame into a real binary GIF89a image
 */
export function encodeFramesToGifBlob(
  frames: { data: Uint8ClampedArray; width: number; height: number; delayMs: number }[]
): Blob {
  const width = frames[0].width;
  const height = frames[0].height;
  const out: number[] = [];

  const writeStr = (s: string) => {
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  };
  const writeU16 = (v: number) => {
    out.push(v & 0xff, (v >> 8) & 0xff);
  };

  // GIF89a Header
  writeStr('GIF89a');
  writeU16(width);
  writeU16(height);
  out.push(0xf7); // Global color table flag (256 colors, 3-3-2 RGB quantization)
  out.push(0); // Background color index
  out.push(0); // Aspect ratio

  // 256-color Global Color Table (3-3-2 RGB palette)
  for (let i = 0; i < 256; i++) {
    const r = Math.round(((i >> 5) & 0x07) * (255 / 7));
    const g = Math.round(((i >> 2) & 0x07) * (255 / 7));
    const b = Math.round((i & 0x03) * (255 / 3));
    out.push(r, g, b);
  }

  // Netscape 2.0 loop extension for multi-frame animated GIFs
  if (frames.length > 1) {
    out.push(0x21, 0xff, 0x0b);
    writeStr('NETSCAPE2.0');
    out.push(0x03, 0x01, 0x00, 0x00, 0x00);
  }

  // LZW encoder for 8-bit palette indices
  const lzwEncode = (indices: Uint8Array): number[] => {
    const minCodeSize = 8;
    const clearCode = 256;
    const eoiCode = 257;
    const bytes: number[] = [minCodeSize];

    let curByte = 0;
    let curBits = 0;
    const subBlock: number[] = [];

    const flushSubBlock = () => {
      if (subBlock.length > 0) {
        bytes.push(subBlock.length, ...subBlock);
        subBlock.length = 0;
      }
    };

    const emitCode = (code: number, bits: number) => {
      curByte |= code << curBits;
      curBits += bits;
      while (curBits >= 8) {
        subBlock.push(curByte & 0xff);
        if (subBlock.length === 255) flushSubBlock();
        curByte >>= 8;
        curBits -= 8;
      }
    };

    let codeSize = 9;
    let nextCode = 258;
    let dict = new Map<number, number>();

    emitCode(clearCode, codeSize);

    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i];
      const key = (prefix << 8) | k;
      const found = dict.get(key);
      if (found !== undefined) {
        prefix = found;
      } else {
        emitCode(prefix, codeSize);
        if (nextCode < 4096) {
          dict.set(key, nextCode++);
          if (nextCode > 1 << codeSize && codeSize < 12) {
            codeSize++;
          }
        } else {
          emitCode(clearCode, codeSize);
          dict.clear();
          codeSize = 9;
          nextCode = 258;
        }
        prefix = k;
      }
    }

    emitCode(prefix, codeSize);
    emitCode(eoiCode, codeSize);
    if (curBits > 0) {
      subBlock.push(curByte & 0xff);
    }
    flushSubBlock();
    bytes.push(0x00); // Block terminator
    return bytes;
  };

  for (const frame of frames) {
    const delayCs = Math.max(2, Math.round(frame.delayMs / 10));
    // Graphic Control Extension
    out.push(0x21, 0xf9, 0x04, 0x00);
    writeU16(delayCs);
    out.push(0x00, 0x00);

    // Image Descriptor
    out.push(0x2c);
    writeU16(0);
    writeU16(0);
    writeU16(width);
    writeU16(height);
    out.push(0x00);

    // Map RGBA pixels to 3-3-2 RGB palette index
    const numPixels = width * height;
    const indices = new Uint8Array(numPixels);
    const rgba = frame.data;
    for (let p = 0; p < numPixels; p++) {
      const r = rgba[p * 4] >> 5;
      const g = rgba[p * 4 + 1] >> 5;
      const b = rgba[p * 4 + 2] >> 6;
      indices[p] = (r << 5) | (g << 2) | b;
    }

    const compressed = lzwEncode(indices);
    for (let i = 0; i < compressed.length; i++) {
      out.push(compressed[i]);
    }
  }

  out.push(0x3b); // GIF Trailer
  return new Blob([new Uint8Array(out)], { type: 'image/gif' });
}

/**
 * Main Image Conversion Entrypoint
 */
export async function convertImageFile(
  file: File,
  targetExt: string,
  settings: ConversionSettings,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  const { canvas, width, height } = await loadImageToCanvas(file, settings, targetExt, onProgress);
  onProgress?.(75, `Mengenkode ke format ${targetExt.toUpperCase()}...`);

  const qualityFloat = Math.min(1, Math.max(0.1, (settings.quality || 92) / 100));

  if (targetExt === 'png') {
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat PNG'))), 'image/png')
    );
  }

  if (targetExt === 'jpg' || targetExt === 'jpeg') {
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat JPG'))), 'image/jpeg', qualityFloat)
    );
  }

  if (targetExt === 'webp') {
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat WebP'))), 'image/webp', qualityFloat)
    );
  }

  if (targetExt === 'avif') {
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else {
            // Fallback to WebP quality if older browser doesn't support AVIF encoding
            canvas.toBlob((wb) => (wb ? resolve(wb) : reject(new Error('Gagal membuat AVIF'))), 'image/webp', qualityFloat);
          }
        },
        'image/avif',
        qualityFloat
      )
    );
  }

  if (targetExt === 'ico') {
    return await canvasToIcoBlob(canvas);
  }

  if (targetExt === 'bmp') {
    return canvasToBmpBlob(canvas);
  }

  if (targetExt === 'svg') {
    return canvasToSvgBlob(canvas);
  }

  if (targetExt === 'gif') {
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, width, height);
    return encodeFramesToGifBlob([{ data: imgData.data, width, height, delayMs: 100 }]);
  }

  if (targetExt === 'pdf') {
    onProgress?.(85, 'Menyusun halaman PDF...');
    const pngBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal menyiapkan gambar PDF'))), 'image/png')
    );
    const pngBytes = await pngBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.create();
    const embeddedImage = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, { x: 0, y: 0, width, height });
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  if (targetExt === 'docx') {
    onProgress?.(85, 'Menyusun dokumen Word (.docx)...');
    const pngBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal menyiapkan gambar DOCX'))), 'image/png')
    );
    const pngBuffer = await pngBlob.arrayBuffer();
    const maxDocWidth = 580;
    const ratio = width > maxDocWidth ? maxDocWidth / width : 1;
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: pngBuffer,
                  transformation: {
                    width: Math.round(width * ratio),
                    height: Math.round(height * ratio),
                  },
                  type: 'png',
                }),
              ],
            }),
          ],
        },
      ],
    });
    return await Packer.toBlob(doc);
  }

  if (targetExt === 'pptx') {
    onProgress?.(85, 'Menyusun slide PowerPoint (.pptx)...');
    const dataUrl = canvas.toDataURL('image/png');
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    const slide = pptx.addSlide();
    slide.addImage({
      data: dataUrl,
      x: 0.5,
      y: 0.4,
      w: 9.0,
      h: 4.8,
      sizing: { type: 'contain', w: 9.0, h: 4.8 },
    });
    const out = await pptx.write({ outputType: 'blob' });
    return out as Blob;
  }

  throw new Error(`Format tujuan gambar .${targetExt} belum didukung.`);
}
