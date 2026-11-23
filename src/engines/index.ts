import { ConversionJob } from '../types/converter';
import { convertImageFile } from './imageEngine';
import {
  convertPdfFile,
  convertPresentationFile,
  convertSpreadsheetFile,
  convertWordFile,
} from './documentEngine';
import { convertMediaFile } from './mediaEngine';
import { convertDataOrTextFile, packageFileToZip } from './dataArchiveEngine';

export interface ConversionResult {
  blob: Blob;
  outputFileName: string;
  finalExt: string;
}

/**
 * Unified conversion dispatcher that routes any ConversionJob to the appropriate client-side engine
 */
export async function executeConversionJob(
  job: ConversionJob,
  onProgress?: (pct: number, msg?: string) => void
): Promise<ConversionResult> {
  const { file, sourceExt, targetExt, settings } = job;
  const inExt = sourceExt.toLowerCase();
  const outExt = targetExt.toLowerCase();
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(5, 'Menyiapkan engine konversi...');

  // 1. Any file -> ZIP archive
  if (outExt === 'zip') {
    const blob = await packageFileToZip(file, onProgress);
    onProgress?.(100, 'Selesai!');
    return {
      blob,
      outputFileName: `${baseName}.zip`,
      finalExt: 'zip',
    };
  }

  // 2. Source is PDF
  if (inExt === 'pdf') {
    const { blob, finalExt } = await convertPdfFile(file, outExt, settings, onProgress);
    onProgress?.(100, 'Selesai!');
    return {
      blob,
      outputFileName: `${baseName}.${finalExt}`,
      finalExt,
    };
  }

  // 3. Source is Word (.docx, .doc, .rtf)
  if (['docx', 'doc', 'rtf'].includes(inExt)) {
    const blob = await convertWordFile(file, outExt, settings, onProgress);
    onProgress?.(100, 'Selesai!');
    return {
      blob,
      outputFileName: `${baseName}.${outExt}`,
      finalExt: outExt,
    };
  }

  // 4. Source is Spreadsheet (.xlsx, .xls, .csv, .ods)
  if (['xlsx', 'xls', 'csv', 'ods'].includes(inExt)) {
    const blob = await convertSpreadsheetFile(file, outExt, settings, onProgress);
    onProgress?.(100, 'Selesai!');
    return {
      blob,
      outputFileName: `${baseName}.${outExt}`,
      finalExt: outExt,
    };
  }

  // 5. Source is PowerPoint (.pptx, .ppt)
  if (['pptx', 'ppt'].includes(inExt)) {
    const blob = await convertPresentationFile(file, outExt, onProgress);
    onProgress?.(100, 'Selesai!');
    return {
      blob,
      outputFileName: `${baseName}.${outExt}`,
      finalExt: outExt,
    };
  }

  // 6. Source is Image
  if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'svg', 'ico', 'heic', 'heif', 'tiff'].includes(inExt)) {
    const blob = await convertImageFile(file, outExt, settings, onProgress);
    onProgress?.(100, 'Selesai!');
    return {
      blob,
      outputFileName: `${baseName}.${outExt}`,
      finalExt: outExt,
    };
  }

  // 7. Source is Audio or Video
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(inExt)) {
    const blob = await convertMediaFile(file, inExt, outExt, settings, onProgress);
    onProgress?.(100, 'Selesai!');
    return {
      blob,
      outputFileName: `${baseName}.${outExt}`,
      finalExt: outExt,
    };
  }

  // 8. Source is Data / Text / Markdown / HTML
  const blob = await convertDataOrTextFile(file, inExt, outExt, settings, onProgress);
  onProgress?.(100, 'Selesai!');
  return {
    blob,
    outputFileName: `${baseName}.${outExt}`,
    finalExt: outExt,
  };
}
