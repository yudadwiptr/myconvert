import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generates a realistic multi-section sample PDF file (with text headings, paragraphs, and financial table)
 * so users can test PDF -> Word, PDF -> Excel, PDF -> PPT, or PDF -> JPG immediately with 1 click.
 */
export function createSamplePdfFile(): File {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('LAPORAN ANALISIS PROYEK MYCONVERT 2026', 40, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    'Dokumen PDF contoh ini dibuat secara otomatis untuk menguji konversi PDF ke Word (.docx),',
    40,
    78
  );
  doc.text(
    'Excel (.xlsx), PowerPoint (.pptx), dan Gambar HD tanpa batasan ukuran file.',
    40,
    94
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('1. Ringkasan Performa Kuartal', 40, 130);

  autoTable(doc, {
    startY: 145,
    head: [['Kode Modul', 'Kategori Engine', 'Status', 'Kapasitas Size', 'Akurasi']],
    body: [
      ['ENG-PDF-01', 'PDF ke Word (.docx)', 'Aktif', 'Unlimited', '98.5%'],
      ['ENG-XLS-02', 'PDF ke Excel (.xlsx)', 'Aktif', 'Unlimited', '99.0%'],
      ['ENG-PPT-03', 'PDF ke PowerPoint (.pptx)', 'Aktif', 'Unlimited', '97.8%'],
      ['ENG-IMG-04', 'Image WebP / AVIF / PNG / ICO', 'Aktif', 'Unlimited', '100%'],
      ['ENG-MED-05', 'Audio & Video FFmpeg WASM', 'Aktif', 'Unlimited', '99.4%'],
    ],
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 10, cellPadding: 6 },
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('2. Kesimpulan & Keamanan Privasi', 40, 320);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    'Seluruh konversi diproses 100% di sisi perangkat pengguna menggunakan teknologi WebAssembly',
    40,
    344
  );
  doc.text(
    'sehingga dokumen rahasia perusahaan tetap aman dan bebas batas kuota upload server.',
    40,
    360
  );

  const blob = doc.output('blob');
  return new File([blob], 'Laporan-Sample-MyConvert.pdf', { type: 'application/pdf' });
}

/**
 * Generates a sample Word (.docx) file
 */
export async function createSampleWordFile(): Promise<File> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: 'Proposal Dokumen Word MyConvert', bold: true, size: 32 })],
          }),
          new Paragraph({
            spacing: { before: 160, after: 160 },
            children: [
              new TextRun({
                text: 'Ini adalah dokumen Microsoft Word (.docx) contoh yang dapat Anda konversi ke PDF, HTML, Markdown, atau TXT.',
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Fitur Unggulan: Tanpa Batas Ukuran File, Konversi Massal (Batch), dan Privasi 100% Aman.',
                bold: true,
                size: 24,
              }),
            ],
          }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  return new File([blob], 'Proposal-Sample-MyConvert.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Generates a sample Excel (.xlsx) file
 */
export function createSampleExcelFile(): File {
  const data = [
    ['ID Transaksi', 'Nama Produk', 'Kategori', 'Jumlah', 'Total Harga (Rp)'],
    ['TRX-1001', 'Lisensi Enterprise Cloud', 'Software', 12, 18500000],
    ['TRX-1002', 'Server NVMe High-Speed', 'Hardware', 4, 32000000],
    ['TRX-1003', 'Paket Optimasi SEO Pro', 'Digital Marketing', 1, 7500000],
    ['TRX-1004', 'Keamanan SSL Wildcard', 'Security', 5, 4250000],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Penjualan');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new File([buf], 'Data-Penjualan-Sample.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generates a high-resolution vibrant sample PNG image
 */
export async function createSampleImageFile(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 960, 540);
  grad.addColorStop(0, '#4F46E5');
  grad.addColorStop(0.5, '#7C3AED');
  grad.addColorStop(1, '#06B6D4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 540);

  // Decorative circles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(820, 110, 160, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(140, 440, 190, 0, Math.PI * 2);
  ctx.fill();

  // Card box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(90, 90, 780, 360);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(90, 90, 780, 360);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('MYCONVERT HIGH-RESOLUTION SAMPLE IMAGE', 140, 175);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('Uji Konversi Gambar & Favicon', 140, 245);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '22px sans-serif';
  ctx.fillText('Konversi ke WebP, AVIF, JPG, ICO Favicon, SVG, BMP, GIF, atau PDF', 140, 305);

  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('Resolusi: 960x540px • Kualitas Lossless • Unlimited File Size', 140, 375);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png')
  );
  return new File([blob], 'Poster-Sample-MyConvert.png', { type: 'image/png' });
}

/**
 * Generates a 2-second stereo musical chord WAV audio file for instant audio conversion testing
 */
export function createSampleAudioFile(): File {
  const sampleRate = 44100;
  const durationSeconds = 2;
  const numSamples = sampleRate * durationSeconds;
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  // Synthesize a pleasant C-major warm synth chord (C4 + E4 + G4) with gentle envelope
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t * 8) * Math.exp(-t * 1.1);
    const wave =
      (Math.sin(2 * Math.PI * 261.63 * t) +
        Math.sin(2 * Math.PI * 329.63 * t) +
        Math.sin(2 * Math.PI * 392.0 * t)) /
      3;
    const sample = Math.max(-1, Math.min(1, wave * env * 0.7));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, int16, true);
    view.setInt16(offset + 2, int16, true);
    offset += 4;
  }

  return new File([buffer], 'Nada-Sample-MyConvert.wav', { type: 'audio/wav' });
}
