import React, { useRef, useState } from 'react';
import {
  Layers,
  Scissors,
  Minimize2,
  Image as ImageIcon,
  Stamp,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { PdfSuiteMode } from '../types/converter';
import {
  compressPdfFile,
  imagesToSinglePdf,
  mergePdfFiles,
  splitPdfFile,
  watermarkPdfFile,
} from '../engines/pdfSuiteEngine';
import { formatBytes } from '../utils/formatBytes';

interface PdfSuitePanelProps {
  initialMode?: PdfSuiteMode;
}

export const PdfSuitePanel: React.FC<PdfSuitePanelProps> = ({ initialMode = 'merge' }) => {
  const [mode, setMode] = useState<PdfSuiteMode>(initialMode);
  const [files, setFiles] = useState<File[]>([]);
  const [pageRange, setPageRange] = useState('1-2');
  const [burstToZip, setBurstToZip] = useState(true);
  const [compressLevel, setCompressLevel] = useState<'light' | 'recommended' | 'extreme'>('recommended');
  const [watermarkText, setWatermarkText] = useState('MYCONVERT VERIFIED');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const suiteTabs: { id: PdfSuiteMode; label: string; desc: string; icon: React.ReactNode; accept: string }[] = [
    {
      id: 'merge',
      label: 'Gabung PDF (Merge)',
      desc: 'Satukan banyak dokumen PDF menjadi 1 file PDF utuh sesuai urutan yang Anda inginkan.',
      icon: <Layers className="w-4 h-4" />,
      accept: '.pdf,application/pdf',
    },
    {
      id: 'split',
      label: 'Pisah PDF (Split)',
      desc: 'Ekstrak halaman tertentu dari PDF atau pecah setiap halaman menjadi file PDF terpisah di dalam ZIP.',
      icon: <Scissors className="w-4 h-4" />,
      accept: '.pdf,application/pdf',
    },
    {
      id: 'compress',
      label: 'Kompres PDF',
      desc: 'Perkecil ukuran file PDF secara drastis dengan tetap menjaga ketajaman teks dan gambar.',
      icon: <Minimize2 className="w-4 h-4" />,
      accept: '.pdf,application/pdf',
    },
    {
      id: 'img2pdf',
      label: 'Gambar ke PDF',
      desc: 'Gabungkan banyak foto JPG, PNG, atau WebP sekaligus menjadi satu dokumen PDF rapi.',
      icon: <ImageIcon className="w-4 h-4" />,
      accept: 'image/*',
    },
    {
      id: 'watermark',
      label: 'Watermark PDF',
      desc: 'Tambahkan teks cap air (watermark) diagonal di seluruh halaman dokumen PDF Anda.',
      icon: <Stamp className="w-4 h-4" />,
      accept: '.pdf,application/pdf',
    },
  ];

  const activeTabInfo = suiteTabs.find((t) => t.id === mode)!;

  const handleAddFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    if (arr.length === 0) return;
    setFiles((prev) => [...prev, ...arr]);
    setResultBlob(null);
    setErrorMsg(null);
  };

  const moveFile = (idx: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const copy = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleLoadSample = async () => {
    const { createSampleImageFile, createSamplePdfFile } = await import('../utils/sampleGenerator');
    if (mode === 'img2pdf') {
      const img1 = await createSampleImageFile();
      const img2 = await createSampleImageFile();
      handleAddFiles([img1, img2]);
    } else {
      const pdf1 = createSamplePdfFile();
      const pdf2 = createSamplePdfFile();
      handleAddFiles(mode === 'merge' ? [pdf1, pdf2] : [pdf1]);
    }
  };

  const handleRunSuite = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(5);
    setStatusMsg('Memulai pemrosesan PDF Suite...');
    setErrorMsg(null);
    setResultBlob(null);

    try {
      const onProg = (pct: number, msg?: string) => {
        setProgress(pct);
        if (msg) setStatusMsg(msg);
      };

      if (mode === 'merge') {
        const blob = await mergePdfFiles(files, onProg);
        setResultBlob(blob);
        setResultName(`MyConvert_Merged_${files.length}_Files.pdf`);
      } else if (mode === 'split') {
        const { blob, ext } = await splitPdfFile(files[0], pageRange, burstToZip, onProg);
        const base = files[0].name.replace(/\.[^/.]+$/, '');
        setResultBlob(blob);
        setResultName(`${base}_Split.${ext}`);
      } else if (mode === 'compress') {
        const blob = await compressPdfFile(files[0], compressLevel, onProg);
        const base = files[0].name.replace(/\.[^/.]+$/, '');
        setResultBlob(blob);
        setResultName(`${base}_Compressed.pdf`);
      } else if (mode === 'img2pdf') {
        const blob = await imagesToSinglePdf(files, onProg);
        setResultBlob(blob);
        setResultName(`MyConvert_Album_${files.length}_Images.pdf`);
      } else if (mode === 'watermark') {
        const blob = await watermarkPdfFile(files[0], watermarkText, onProg);
        const base = files[0].name.replace(/\.[^/.]+$/, '');
        setResultBlob(blob);
        setResultName(`${base}_Watermarked.pdf`);
      }
      setProgress(100);
      setStatusMsg('Selesai diproses!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalInputBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="rounded-3xl smooth-theme border border-line bg-surface/85 backdrop-blur-xl p-5 sm:p-7 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.14)] dark:shadow-2xl">
      {/* Sub-navigation pills */}
      <div className="flex flex-wrap gap-2 pb-5 border-b border-line-soft">
        {suiteTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setMode(tab.id);
              setFiles([]);
              setResultBlob(null);
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold smooth-theme ${
              mode === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-sunken/70 text-fg-muted border border-line hover:text-indigo-700 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mode description */}
      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-fg">
            {activeTabInfo.label}
          </h3>
          <p className="text-xs text-fg-muted mt-0.5 font-medium">
            {activeTabInfo.desc}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-100/90 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/25 hover:bg-indigo-200/80 dark:hover:bg-indigo-500/20 smooth-theme self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Muat File Contoh</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleAddFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-line hover:border-indigo-500 bg-sunken/40 hover:bg-purple-50/80 dark:hover:bg-indigo-950/15 smooth-theme p-7 text-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={mode === 'merge' || mode === 'img2pdf'}
          accept={activeTabInfo.accept}
          onChange={(e) => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
        <Upload className="w-9 h-9 text-accent mx-auto mb-2.5" />
        <div className="text-sm font-extrabold text-fg">
          Klik atau tarik file {mode === 'img2pdf' ? 'Gambar (JPG, PNG, WebP)' : 'PDF'} ke sini
        </div>
        <p className="text-xs text-fg-muted mt-1 font-medium">
          Tanpa Batas Ukuran File (Unlimited Size) • Diproses langsung di browser Anda
        </p>
      </div>

      {/* Mode-specific configuration controls */}
      {mode === 'split' && (
        <div className="mt-4 p-4 rounded-2xl bg-sunken/50 border border-line grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">
              Rentang Halaman yang Diambil
            </label>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="Contoh: 1-3, 5 atau all"
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-line text-fg"
            />
          </div>
          <div className="flex items-center pt-4">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-fg-soft">
              <input
                type="checkbox"
                checked={burstToZip}
                onChange={(e) => setBurstToZip(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span>Simpan setiap halaman sebagai file PDF terpisah di dalam .ZIP</span>
            </label>
          </div>
        </div>
      )}

      {mode === 'compress' && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'light', title: 'Kompresi Ringan', desc: 'Kualitas visual tertinggi (DPI tinggi)' },
            { id: 'recommended', title: 'Kompresi Standar', desc: 'Seimbang antara ukuran kecil & ketajaman' },
            { id: 'extreme', title: 'Kompresi Ekstrem', desc: 'Ukuran file paling kecil untuk kirim email' },
          ].map((lv) => (
            <button
              key={lv.id}
              type="button"
              onClick={() => setCompressLevel(lv.id as typeof compressLevel)}
              className={`p-3.5 rounded-xl border text-left smooth-theme ${
                compressLevel === lv.id
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-fg'
                  : 'bg-sunken/40 border-line text-fg-muted'
              }`}
            >
              <div className="text-xs font-extrabold">{lv.title}</div>
              <div className="text-[11px] text-fg-muted mt-1">{lv.desc}</div>
            </button>
          ))}
        </div>
      )}

      {mode === 'watermark' && (
        <div className="mt-4 p-4 rounded-2xl bg-sunken/50 border border-line">
          <label className="block text-xs font-bold text-fg-soft mb-1.5">
            Teks Watermark Diagonal
          </label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Masukkan teks watermark..."
            className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface border border-line text-fg"
          />
        </div>
      )}

      {/* Selected file list */}
      {files.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-fg-muted px-1">
            <span>
              {files.length} file dipilih ({formatBytes(totalInputBytes)})
            </span>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setResultBlob(null);
              }}
              className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
            >
              Hapus Semua
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((f, idx) => (
              <div
                key={`${f.name}-${idx}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-sunken border border-line"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-mono font-extrabold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-fg truncate">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{formatBytes(f.size)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {(mode === 'merge' || mode === 'img2pdf') && (
                    <>
                      <button
                        type="button"
                        onClick={() => moveFile(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-white disabled:opacity-30"
                        title="Naikkan urutan"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFile(idx, 1)}
                        disabled={idx === files.length - 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-white disabled:opacity-30"
                        title="Turunkan urutan"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action button */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRunSuite}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/25 smooth-theme"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusMsg || `Memproses (${progress}%)...`}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Proses {activeTabInfo.label} Sekarang</span>
                </>
              )}
            </button>

            {resultBlob && (
              <div className="flex items-center gap-3 bg-emerald-100/90 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 px-4 py-2.5 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-extrabold text-fg">{resultName}</div>
                  <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    Ukuran akhir: {formatBytes(resultBlob.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => saveAs(resultBlob, resultName)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-xs font-bold text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
