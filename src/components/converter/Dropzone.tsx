import React, { useState } from 'react';
import { ArrowRight, FileText, Image as ImageIcon, Music, Plus, Sparkles, Table, Upload } from 'lucide-react';

type SampleKind = 'pdf' | 'word' | 'excel' | 'image' | 'audio';

async function createSample(kind: SampleKind): Promise<File> {
  const gen = await import('../../utils/sampleGenerator');
  switch (kind) {
    case 'pdf':
      return gen.createSamplePdfFile();
    case 'word':
      return gen.createSampleWordFile();
    case 'excel':
      return gen.createSampleExcelFile();
    case 'image':
      return gen.createSampleImageFile();
    case 'audio':
      return gen.createSampleAudioFile();
  }
}

const SAMPLES: {
  kind: SampleKind;
  target: string;
  from: string;
  to?: string;
  icon: React.ReactNode;
  className: string;
}[] = [
  {
    kind: 'pdf',
    target: 'docx',
    from: 'Sample PDF',
    to: 'Word',
    icon: <FileText className="w-3.5 h-3.5" />,
    className:
      'bg-rose-100/90 text-rose-700 border-rose-200 hover:bg-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25 dark:hover:bg-rose-500/20',
  },
  {
    kind: 'pdf',
    target: 'xlsx',
    from: 'Sample PDF',
    to: 'Excel',
    icon: <Table className="w-3.5 h-3.5" />,
    className:
      'bg-emerald-100/90 text-emerald-700 border-emerald-200 hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25 dark:hover:bg-emerald-500/20',
  },
  {
    kind: 'word',
    target: 'pdf',
    from: 'Sample Word',
    to: 'PDF',
    icon: <FileText className="w-3.5 h-3.5" />,
    className:
      'bg-blue-100/90 text-blue-700 border-blue-200 hover:bg-blue-200/80 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25 dark:hover:bg-blue-500/20',
  },
  {
    kind: 'excel',
    target: 'pdf',
    from: 'Sample Excel',
    to: 'PDF',
    icon: <Table className="w-3.5 h-3.5" />,
    className:
      'bg-teal-100/90 text-teal-700 border-teal-200 hover:bg-teal-200/80 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/25 dark:hover:bg-teal-500/20',
  },
  {
    kind: 'image',
    target: 'webp',
    from: 'Sample PNG',
    to: 'WebP / ICO',
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    className:
      'bg-sky-100/90 text-sky-700 border-sky-200 hover:bg-sky-200/80 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25 dark:hover:bg-sky-500/20',
  },
  {
    kind: 'audio',
    target: 'wav',
    from: 'Sample Audio',
    icon: <Music className="w-3.5 h-3.5" />,
    className:
      'bg-purple-100/90 text-purple-700 border-purple-200 hover:bg-purple-200/80 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/25 dark:hover:bg-purple-500/20',
  },
];

interface DropzoneProps {
  onFiles: (files: FileList | File[], preferredTargetExt?: string) => void;
  onBrowse: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFiles, onBrowse }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) onFiles(e.dataTransfer.files);
      }}
      className={`smooth-theme p-6 sm:p-10 text-center border-b border-line-soft ${
        isDragging ? 'bg-indigo-500/10 border-indigo-500' : 'bg-sunken/35'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Pilih file untuk dikonversi"
        onClick={onBrowse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onBrowse();
          }
        }}
        className="cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/40 max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-line hover:border-indigo-500 dark:hover:border-indigo-400 bg-white/85 dark:bg-slate-950/60 hover:bg-purple-50/50 dark:hover:bg-indigo-950/20 smooth-theme p-7 sm:p-9 group shadow-sm"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-600/20 dark:to-violet-600/20 border border-purple-200 dark:border-indigo-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
          <Upload className="w-8 h-8 text-accent" />
        </div>

        <div className="text-lg sm:text-xl font-extrabold text-fg">
          Pilih File atau Tarik & Lepas (Drag & Drop) ke Sini
        </div>
        <p className="text-xs sm:text-sm text-fg-muted mt-1.5 font-medium">
          Mendukung PDF, Word, Excel, PPT, JPG, PNG, WebP, AVIF, HEIC, SVG, ICO, MP4, MP3, WAV, JSON, CSV, ZIP
        </p>

        <div className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all duration-300">
          <Plus className="w-4 h-4" />
          <span>Pilih File dari Perangkat</span>
        </div>
      </div>

      {/* One-click sample files */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-bold text-fg-muted mr-1 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Uji Coba Instan (1-Klik Sample):</span>
        </span>
        {SAMPLES.map((sample) => (
          <button
            key={`${sample.kind}-${sample.target}`}
            type="button"
            onClick={async () => onFiles([await createSample(sample.kind)], sample.target)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border smooth-theme ${sample.className}`}
          >
            {sample.icon}
            <span>{sample.from}</span>
            {sample.to && (
              <>
                <ArrowRight className="w-3 h-3 opacity-75" />
                <span>{sample.to}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
