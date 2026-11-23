import { ConversionSettings, FormatCategory, FormatInfo, PopularToolPreset } from '../types/converter';

export const DEFAULT_SETTINGS: ConversionSettings = {
  quality: 92,
  scale: 100,
  filter: 'none',
  rotation: 0,
  backgroundColor: '#ffffff',
  icoSize: 256,
  pdfToWordMode: 'hybrid',
  pdfDpiScale: 2,
  pageRange: 'all',
  pdfOrientation: 'portrait',
  audioSampleRate: 44100,
  audioChannels: 2,
  gifFps: 10,
  gifWidth: 480,
  videoMaxDuration: 0,
};

export const CATEGORY_LABELS: Record<FormatCategory, { name: string; color: string }> = {
  document: { name: 'Dokumen & PDF', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  spreadsheet: { name: 'Excel & Tabel', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  presentation: { name: 'Presentasi PPT', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  image: { name: 'Gambar & Foto', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  audio: { name: 'Audio & Musik', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  video: { name: 'Video & Animasi', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  data: { name: 'Data & Kode', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  archive: { name: 'Arsip ZIP', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
};

export const FORMAT_REGISTRY: Record<string, FormatInfo> = {
  // Documents
  pdf: {
    ext: 'pdf',
    label: 'PDF',
    mime: 'application/pdf',
    category: 'document',
    description: 'Portable Document Format',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  docx: {
    ext: 'docx',
    label: 'DOCX (Word)',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'document',
    description: 'Microsoft Word Document',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  doc: {
    ext: 'doc',
    label: 'DOC (Word)',
    mime: 'application/msword',
    category: 'document',
    description: 'Microsoft Word Legacy',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  txt: {
    ext: 'txt',
    label: 'TXT',
    mime: 'text/plain',
    category: 'document',
    description: 'Plain Text Document',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
  rtf: {
    ext: 'rtf',
    label: 'RTF',
    mime: 'application/rtf',
    category: 'document',
    description: 'Rich Text Format',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  md: {
    ext: 'md',
    label: 'MD (Markdown)',
    mime: 'text/markdown',
    category: 'document',
    description: 'Markdown Document',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
  html: {
    ext: 'html',
    label: 'HTML',
    mime: 'text/html',
    category: 'document',
    description: 'HyperText Markup Language',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },

  // Spreadsheets
  xlsx: {
    ext: 'xlsx',
    label: 'XLSX (Excel)',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'spreadsheet',
    description: 'Microsoft Excel Workbook',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  xls: {
    ext: 'xls',
    label: 'XLS (Excel)',
    mime: 'application/vnd.ms-excel',
    category: 'spreadsheet',
    description: 'Microsoft Excel Legacy',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  csv: {
    ext: 'csv',
    label: 'CSV',
    mime: 'text/csv',
    category: 'spreadsheet',
    description: 'Comma-Separated Values',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  ods: {
    ext: 'ods',
    label: 'ODS',
    mime: 'application/vnd.oasis.opendocument.spreadsheet',
    category: 'spreadsheet',
    description: 'OpenDocument Spreadsheet',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
  },

  // Presentations
  pptx: {
    ext: 'pptx',
    label: 'PPTX (PowerPoint)',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    category: 'presentation',
    description: 'Microsoft PowerPoint Presentation',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  ppt: {
    ext: 'ppt',
    label: 'PPT',
    mime: 'application/vnd.ms-powerpoint',
    category: 'presentation',
    description: 'Microsoft PowerPoint Legacy',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },

  // Images
  png: {
    ext: 'png',
    label: 'PNG',
    mime: 'image/png',
    category: 'image',
    description: 'Portable Network Graphics (Transparan)',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  jpg: {
    ext: 'jpg',
    label: 'JPG',
    mime: 'image/jpeg',
    category: 'image',
    description: 'Joint Photographic Experts Group',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  jpeg: {
    ext: 'jpeg',
    label: 'JPEG',
    mime: 'image/jpeg',
    category: 'image',
    description: 'Joint Photographic Experts Group',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  webp: {
    ext: 'webp',
    label: 'WEBP',
    mime: 'image/webp',
    category: 'image',
    description: 'Modern Web Picture Format',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  avif: {
    ext: 'avif',
    label: 'AVIF',
    mime: 'image/avif',
    category: 'image',
    description: 'AV1 Image File Format',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  svg: {
    ext: 'svg',
    label: 'SVG',
    mime: 'image/svg+xml',
    category: 'image',
    description: 'Scalable Vector Graphics',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  ico: {
    ext: 'ico',
    label: 'ICO (Favicon)',
    mime: 'image/x-icon',
    category: 'image',
    description: 'Windows & Website Favicon Icon',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  bmp: {
    ext: 'bmp',
    label: 'BMP',
    mime: 'image/bmp',
    category: 'image',
    description: 'Uncompressed Windows Bitmap',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
  gif: {
    ext: 'gif',
    label: 'GIF',
    mime: 'image/gif',
    category: 'image',
    description: 'Graphics Interchange Format',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  heic: {
    ext: 'heic',
    label: 'HEIC (iPhone)',
    mime: 'image/heic',
    category: 'image',
    description: 'Apple High Efficiency Image',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  },
  heif: {
    ext: 'heif',
    label: 'HEIF',
    mime: 'image/heif',
    category: 'image',
    description: 'High Efficiency Image Format',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  },
  tiff: {
    ext: 'tiff',
    label: 'TIFF',
    mime: 'image/tiff',
    category: 'image',
    description: 'Tagged Image File Format',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },

  // Audio
  mp3: {
    ext: 'mp3',
    label: 'MP3',
    mime: 'audio/mpeg',
    category: 'audio',
    description: 'MPEG Layer-3 Audio',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  wav: {
    ext: 'wav',
    label: 'WAV',
    mime: 'audio/wav',
    category: 'audio',
    description: 'Lossless Waveform Audio',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  ogg: {
    ext: 'ogg',
    label: 'OGG',
    mime: 'audio/ogg',
    category: 'audio',
    description: 'Ogg Vorbis / Opus Audio',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  aac: {
    ext: 'aac',
    label: 'AAC',
    mime: 'audio/aac',
    category: 'audio',
    description: 'Advanced Audio Coding',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  flac: {
    ext: 'flac',
    label: 'FLAC',
    mime: 'audio/flac',
    category: 'audio',
    description: 'Free Lossless Audio Codec',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  m4a: {
    ext: 'm4a',
    label: 'M4A',
    mime: 'audio/mp4',
    category: 'audio',
    description: 'MPEG-4 Audio',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },

  // Video
  mp4: {
    ext: 'mp4',
    label: 'MP4',
    mime: 'video/mp4',
    category: 'video',
    description: 'MPEG-4 Video Container',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  webm: {
    ext: 'webm',
    label: 'WEBM',
    mime: 'video/webm',
    category: 'video',
    description: 'WebM Open Video Format',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  mov: {
    ext: 'mov',
    label: 'MOV',
    mime: 'video/quicktime',
    category: 'video',
    description: 'Apple QuickTime Movie',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  mkv: {
    ext: 'mkv',
    label: 'MKV',
    mime: 'video/x-matroska',
    category: 'video',
    description: 'Matroska Multimedia Container',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  avi: {
    ext: 'avi',
    label: 'AVI',
    mime: 'video/x-msvideo',
    category: 'video',
    description: 'Audio Video Interleave',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },

  // Data
  json: {
    ext: 'json',
    label: 'JSON',
    mime: 'application/json',
    category: 'data',
    description: 'JavaScript Object Notation',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  xml: {
    ext: 'xml',
    label: 'XML',
    mime: 'application/xml',
    category: 'data',
    description: 'Extensible Markup Language',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  yaml: {
    ext: 'yaml',
    label: 'YAML',
    mime: 'text/yaml',
    category: 'data',
    description: 'YAML Data Serialization',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  sql: {
    ext: 'sql',
    label: 'SQL',
    mime: 'application/sql',
    category: 'data',
    description: 'SQL Database Script',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },

  // Archive
  zip: {
    ext: 'zip',
    label: 'ZIP',
    mime: 'application/zip',
    category: 'archive',
    description: 'Compressed ZIP Archive',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
};

/**
 * Given a source file extension, returns all valid output format extensions
 */
export function getAvailableTargetFormats(sourceExt: string): string[] {
  const ext = sourceExt.toLowerCase();

  // PDF can convert to Word, Excel, PPT, Images, Text, HTML, Markdown, JSON, ZIP
  if (ext === 'pdf') {
    return ['docx', 'xlsx', 'pptx', 'png', 'jpg', 'webp', 'txt', 'html', 'md', 'csv', 'json', 'zip'];
  }

  // Word (.docx / .doc / .rtf)
  if (ext === 'docx' || ext === 'doc' || ext === 'rtf') {
    return ['pdf', 'txt', 'html', 'md', 'docx', 'json', 'zip'];
  }

  // Spreadsheets (.xlsx / .xls / .csv / .ods)
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || ext === 'ods') {
    return ['pdf', 'xlsx', 'csv', 'json', 'html', 'md', 'xml', 'sql', 'txt', 'zip'].filter((t) => t !== ext);
  }

  // PowerPoint (.pptx / .ppt)
  if (ext === 'pptx' || ext === 'ppt') {
    return ['pdf', 'html', 'txt', 'json', 'md', 'zip'];
  }

  // Text / Markdown / HTML
  if (ext === 'txt' || ext === 'md' || ext === 'html') {
    return ['pdf', 'docx', 'html', 'md', 'txt', 'rtf', 'json', 'zip'].filter((t) => t !== ext);
  }

  // Images
  if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'svg', 'ico', 'heic', 'heif', 'tiff'].includes(ext)) {
    const targets = ['png', 'jpg', 'webp', 'avif', 'pdf', 'ico', 'svg', 'bmp', 'gif', 'docx', 'pptx', 'zip'];
    return targets.filter((t) => t !== ext && !(ext === 'jpeg' && t === 'jpg'));
  }

  // Video
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return ['mp3', 'wav', 'ogg', 'gif', 'webm', 'mp4', 'png', 'jpg', 'zip'].filter((t) => t !== ext);
  }

  // Audio
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) {
    return ['wav', 'mp3', 'ogg', 'aac', 'flac', 'zip'].filter((t) => t !== ext);
  }

  // Data (JSON / XML / YAML)
  if (['json', 'xml', 'yaml'].includes(ext)) {
    return ['xlsx', 'csv', 'pdf', 'json', 'xml', 'yaml', 'sql', 'html', 'md', 'txt', 'zip'].filter((t) => t !== ext);
  }

  // Fallback: any file can be packaged into ZIP or inspected
  return ['zip', 'pdf', 'txt'];
}

export function getDefaultTargetFormat(sourceExt: string, preferredTarget?: string): string {
  const available = getAvailableTargetFormats(sourceExt);
  if (preferredTarget && available.includes(preferredTarget.toLowerCase())) {
    return preferredTarget.toLowerCase();
  }
  const ext = sourceExt.toLowerCase();
  if (ext === 'pdf') return 'docx';
  if (ext === 'docx' || ext === 'doc') return 'pdf';
  if (ext === 'xlsx' || ext === 'xls') return 'pdf';
  if (ext === 'csv') return 'xlsx';
  if (ext === 'pptx' || ext === 'ppt') return 'pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'png';
  if (ext === 'png') return 'webp';
  if (ext === 'webp' || ext === 'avif') return 'png';
  if (ext === 'heic' || ext === 'heif') return 'jpg';
  if (ext === 'svg') return 'png';
  if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext)) return 'mp3';
  if (ext === 'mp3') return 'wav';
  if (ext === 'wav') return 'mp3';
  if (ext === 'json') return 'xlsx';
  return available[0] || 'pdf';
}

export function detectFileExtension(file: File): string {
  const parts = file.name.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase();
    if (FORMAT_REGISTRY[ext]) return ext;
    if (ext === 'tif') return 'tiff';
    if (ext === 'yml') return 'yaml';
    if (ext === 'htm') return 'html';
    return ext;
  }
  if (file.type.includes('pdf')) return 'pdf';
  if (file.type.includes('png')) return 'png';
  if (file.type.includes('jpeg')) return 'jpg';
  if (file.type.includes('webp')) return 'webp';
  return 'txt';
}

export function detectFormatCategory(ext: string): FormatCategory {
  return FORMAT_REGISTRY[ext.toLowerCase()]?.category || 'document';
}

export const POPULAR_TOOLS: PopularToolPreset[] = [
  {
    id: 'pdf-to-word',
    title: 'PDF ke Word',
    subtitle: 'Ubah PDF menjadi dokumen Word (.docx) yang rapi & bisa diedit',
    fromExt: 'pdf',
    toExt: 'docx',
    category: 'document',
    badge: 'Terpopuler',
    seoTitle: 'Convert PDF ke Word (.DOCX) Online Gratis Tanpa Batas Size — MyConvert',
    seoDescription: 'Ubah file PDF menjadi dokumen Microsoft Word (.docx) yang dapat diedit tanpa batasan ukuran file dan 100% gratis.',
  },
  {
    id: 'pdf-to-excel',
    title: 'PDF ke Excel',
    subtitle: 'Ekstrak tabel & data dari PDF langsung ke lembar kerja Excel (.xlsx)',
    fromExt: 'pdf',
    toExt: 'xlsx',
    category: 'spreadsheet',
    badge: 'Akurat',
    seoTitle: 'Convert PDF ke Excel (.XLSX) Online Gratis Tanpa Batas Size — MyConvert',
    seoDescription: 'Ekstrak tabel PDF ke spreadsheet Microsoft Excel (.xlsx) multi-sheet secara otomatis dan akurat tanpa batasan size.',
  },
  {
    id: 'pdf-to-ppt',
    title: 'PDF ke PowerPoint',
    subtitle: 'Konversi setiap halaman PDF menjadi slide presentasi PPTX',
    fromExt: 'pdf',
    toExt: 'pptx',
    category: 'presentation',
    badge: 'Slide HD',
    seoTitle: 'Convert PDF ke PowerPoint (.PPTX) Online Gratis — MyConvert',
    seoDescription: 'Ubah dokumen PDF menjadi slide presentasi PowerPoint (.pptx) resolusi tinggi secara instan.',
  },
  {
    id: 'word-to-pdf',
    title: 'Word ke PDF',
    subtitle: 'Ubah dokumen DOCX menjadi file PDF siap cetak',
    fromExt: 'docx',
    toExt: 'pdf',
    category: 'document',
    seoTitle: 'Convert Word (.DOCX) ke PDF Online Gratis — MyConvert',
    seoDescription: 'Konversi file Microsoft Word (.docx) ke PDF dengan cepat tanpa watermark dan tanpa batas ukuran.',
  },
  {
    id: 'excel-to-pdf',
    title: 'Excel ke PDF',
    subtitle: 'Konversi tabel Excel (.xlsx / .csv) menjadi laporan PDF',
    fromExt: 'xlsx',
    toExt: 'pdf',
    category: 'spreadsheet',
    seoTitle: 'Convert Excel (.XLSX) ke PDF Online Gratis — MyConvert',
    seoDescription: 'Ubah spreadsheet Excel dan CSV menjadi tabel PDF yang rapi dan siap cetak.',
  },
  {
    id: 'ppt-to-pdf',
    title: 'PPT ke PDF',
    subtitle: 'Konversi slide PowerPoint (.pptx) ke dokumen PDF',
    fromExt: 'pptx',
    toExt: 'pdf',
    category: 'presentation',
    seoTitle: 'Convert PowerPoint (.PPTX) ke PDF Online Gratis — MyConvert',
    seoDescription: 'Ubah presentasi PowerPoint (.pptx) menjadi file PDF dengan cepat.',
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF ke JPG / PNG',
    subtitle: 'Simpan halaman PDF sebagai gambar beresolusi tinggi (300 DPI)',
    fromExt: 'pdf',
    toExt: 'jpg',
    category: 'image',
    seoTitle: 'Convert PDF ke JPG & PNG Resolusi Tinggi — MyConvert',
    seoDescription: 'Ekstrak halaman PDF menjadi gambar JPG atau PNG berkualitas HD tanpa batas ukuran file.',
  },
  {
    id: 'jpg-to-png',
    title: 'JPG ke PNG',
    subtitle: 'Konversi foto JPG ke PNG berkualitas tinggi secara massal',
    fromExt: 'jpg',
    toExt: 'png',
    category: 'image',
    badge: 'Batch Cepat',
    seoTitle: 'Ubah JPG ke PNG Online Gratis Tanpa Batas Size — MyConvert',
    seoDescription: 'Konversi banyak gambar JPG ke PNG sekaligus tanpa penurunan kualitas.',
  },
  {
    id: 'webp-to-png',
    title: 'WebP / AVIF ke PNG',
    subtitle: 'Ubah gambar WebP atau AVIF menjadi PNG atau JPG standar',
    fromExt: 'webp',
    toExt: 'png',
    category: 'image',
    seoTitle: 'Convert WebP & AVIF ke PNG/JPG Online Gratis — MyConvert',
    seoDescription: 'Konversi gambar WebP dan AVIF menjadi PNG atau JPG secara instan di browser.',
  },
  {
    id: 'heic-to-jpg',
    title: 'HEIC iPhone ke JPG',
    subtitle: 'Buka dan ubah foto HEIC/HEIF dari iPhone menjadi JPG/PNG',
    fromExt: 'heic',
    toExt: 'jpg',
    category: 'image',
    badge: 'iPhone',
    seoTitle: 'Convert HEIC ke JPG Online Gratis — MyConvert',
    seoDescription: 'Ubah foto iPhone berformat HEIC atau HEIF ke JPG dan PNG tanpa upload ke server.',
  },
  {
    id: 'png-to-ico',
    title: 'Gambar ke ICO Favicon',
    subtitle: 'Buat file favicon.ico untuk website dari PNG, JPG, atau SVG',
    fromExt: 'png',
    toExt: 'ico',
    category: 'image',
    badge: 'Web Dev',
    seoTitle: 'Convert PNG/SVG ke ICO Favicon Generator Online — MyConvert',
    seoDescription: 'Buat favicon .ICO multi-resolusi dari gambar PNG, JPG, atau SVG secara gratis.',
  },
  {
    id: 'png-to-svg',
    title: 'PNG/JPG ke Vector SVG',
    subtitle: 'Konversi gambar raster menjadi format Scalable Vector Graphics (.svg)',
    fromExt: 'png',
    toExt: 'svg',
    category: 'image',
    seoTitle: 'Convert PNG & JPG ke SVG Vector Online — MyConvert',
    seoDescription: 'Ubah gambar PNG atau JPG menjadi file SVG secara cepat dan gratis.',
  },
  {
    id: 'mp4-to-mp3',
    title: 'MP4 Video ke MP3 / WAV',
    subtitle: 'Ekstrak suara atau musik dari video MP4, MOV, MKV tanpa batas ukuran',
    fromExt: 'mp4',
    toExt: 'mp3',
    category: 'audio',
    badge: 'Unlimited GB',
    seoTitle: 'Convert MP4 ke MP3 & WAV Tanpa Batas Ukuran File — MyConvert',
    seoDescription: 'Ekstrak audio MP3 dan WAV jernih dari file video MP4, MKV, atau MOV berukuran besar.',
  },
  {
    id: 'mp4-to-gif',
    title: 'Video MP4 ke Animasi GIF',
    subtitle: 'Ubah cuplikan video MP4/WebM menjadi gambar bergerak GIF',
    fromExt: 'mp4',
    toExt: 'gif',
    category: 'video',
    seoTitle: 'Convert Video MP4 ke GIF Animasi Online Gratis — MyConvert',
    seoDescription: 'Ubah video MP4 dan WebM menjadi animasi GIF dengan pengaturan FPS dan resolusi.',
  },
  {
    id: 'json-to-excel',
    title: 'JSON / CSV ke Excel',
    subtitle: 'Ubah data JSON atau CSV menjadi tabel Excel (.xlsx) & SQL',
    fromExt: 'json',
    toExt: 'xlsx',
    category: 'data',
    seoTitle: 'Convert JSON & CSV ke Excel (.XLSX) Online — MyConvert',
    seoDescription: 'Konversi data JSON, XML, dan CSV menjadi spreadsheet Excel (.xlsx) atau script SQL.',
  },
  {
    id: 'merge-pdf',
    title: 'Gabung PDF (Merge)',
    subtitle: 'Satukan banyak dokumen PDF menjadi 1 file PDF berurutan',
    fromExt: 'pdf',
    toExt: 'pdf',
    category: 'pdf-suite',
    pdfSuiteMode: 'merge',
    badge: 'PDF Suite',
    seoTitle: 'Merge PDF — Gabungkan Banyak File PDF Jadi Satu Gratis — MyConvert',
    seoDescription: 'Gabungkan puluhan file PDF menjadi satu dokumen PDF tanpa batasan ukuran file.',
  },
];
