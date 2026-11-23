export type FormatCategory =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'audio'
  | 'video'
  | 'data'
  | 'archive';

export interface FormatInfo {
  ext: string;
  label: string;
  mime: string;
  category: FormatCategory;
  description: string;
  badgeColor: string;
}

export interface ConversionSettings {
  // Image settings
  quality: number; // 10 - 100
  scale: number; // 25, 50, 75, 100, 150, 200
  customWidth?: number;
  customHeight?: number;
  filter: 'none' | 'grayscale' | 'sepia' | 'invert' | 'contrast';
  rotation: 0 | 90 | 180 | 270;
  backgroundColor: string;
  icoSize: 16 | 32 | 48 | 64 | 128 | 256;

  // PDF & Office settings
  pdfToWordMode: 'hybrid' | 'editable' | 'visual';
  pdfDpiScale: 1.5 | 2 | 3;
  pageRange: string; // e.g. "all" or "1-3, 5"
  pdfOrientation: 'portrait' | 'landscape';

  // Audio & Video settings
  audioSampleRate: 22050 | 44100 | 48000;
  audioChannels: 1 | 2;
  gifFps: 8 | 10 | 15;
  gifWidth: 320 | 480 | 640;
  videoMaxDuration: number; // 0 = full
}

export type JobStatus = 'idle' | 'converting' | 'done' | 'error';

export interface ConversionJob {
  id: string;
  file: File;
  sourceExt: string;
  sourceCategory: FormatCategory;
  targetExt: string;
  status: JobStatus;
  progress: number;
  statusMessage?: string;
  settings: ConversionSettings;
  resultBlob?: Blob;
  resultUrl?: string;
  resultFileName?: string;
  resultSize?: number;
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface PopularToolPreset {
  id: string;
  title: string;
  subtitle: string;
  fromExt: string;
  toExt: string;
  category: FormatCategory | 'pdf-suite';
  badge?: string;
  seoTitle: string;
  seoDescription: string;
  pdfSuiteMode?: PdfSuiteMode;
}

export type PdfSuiteMode = 'merge' | 'split' | 'compress' | 'img2pdf' | 'watermark';
