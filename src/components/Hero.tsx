import React from 'react';
import { Infinity as InfinityIcon, ShieldCheck, X, Zap } from 'lucide-react';
import { PopularToolPreset } from '../types/converter';

interface HeroProps {
  activePreset: PopularToolPreset | null;
  onClearPreset: () => void;
}

const DEFAULT_SUBTITLE =
  'Ubah PDF ke Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Gambar (JPG, PNG, WebP, AVIF, SVG, ICO, HEIC), hingga Video & Audio (MP4, MP3, WAV, GIF) langsung dengan kecepatan tinggi.';

export const Hero: React.FC<HeroProps> = ({ activePreset, onClearPreset }) => (
  <section className="text-center max-w-3xl mx-auto space-y-4">
    <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-1.5 rounded-full smooth-theme bg-surface/85 border border-line shadow-sm text-xs font-bold">
      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <InfinityIcon className="w-3.5 h-3.5" />
        <span>Tanpa Batas Size</span>
      </span>
      <span className="w-1 h-1 rounded-full bg-purple-300 dark:bg-slate-700" aria-hidden="true" />
      <span className="inline-flex items-center gap-1.5 text-accent">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Privasi 100% Aman</span>
      </span>
      <span className="w-1 h-1 rounded-full bg-purple-300 dark:bg-slate-700" aria-hidden="true" />
      <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
        <Zap className="w-3.5 h-3.5" />
        <span>Gratis Tanpa Watermark</span>
      </span>
    </div>

    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg leading-tight">
      {activePreset ? (
        <>
          Konversi <span className="text-accent">{activePreset.title}</span>{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-500 dark:from-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent">
            Tanpa Batas Ukuran
          </span>
        </>
      ) : (
        <>
          Konversi Semua Format File{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-300 bg-clip-text text-transparent">
            Tanpa Batasan Size
          </span>
        </>
      )}
    </h1>

    <p className="text-sm sm:text-base text-fg-muted max-w-2xl mx-auto leading-relaxed font-medium">
      {activePreset ? activePreset.subtitle : DEFAULT_SUBTITLE}
    </p>

    {activePreset && (
      <div className="pt-1">
        <button
          type="button"
          onClick={onClearPreset}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full smooth-theme bg-purple-100/80 dark:bg-slate-900 border border-line text-xs font-bold text-purple-900 dark:text-slate-300 hover:bg-purple-200/80 dark:hover:text-white"
        >
          <span>Mode Fokus: {activePreset.title}</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )}
  </section>
);
