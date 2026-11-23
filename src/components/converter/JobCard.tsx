import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Loader2,
  Play,
  RefreshCw,
  Sliders,
  Trash2,
} from 'lucide-react';
import { ConversionJob } from '../../types/converter';
import { FORMAT_REGISTRY } from '../../data/formats';
import { formatBytes } from '../../utils/formatBytes';
import { CategoryIcon } from '../../utils/categoryIcon';

interface JobCardProps {
  job: ConversionJob;
  onPickFormat: () => void;
  onOpenSettings: () => void;
  onRun: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onRemove: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPickFormat,
  onOpenSettings,
  onRun,
  onPreview,
  onDownload,
  onRemove,
}) => {
  const srcInfo = FORMAT_REGISTRY[job.sourceExt];
  const dstInfo = FORMAT_REGISTRY[job.targetExt];
  const isConverting = job.status === 'converting';

  return (
    <li
      className={`relative overflow-hidden rounded-2xl smooth-theme border ${
        job.status === 'error'
          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30'
          : 'bg-sunken/55 border-line/80 hover:border-purple-300 dark:hover:border-slate-700/80'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-3 p-3 sm:p-3.5 sm:px-5">
        {/* File info */}
        <div className="flex items-center gap-3 min-w-0 basis-full sm:basis-0 sm:flex-1">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-extrabold uppercase border shrink-0 ${
              srcInfo?.badgeColor ||
              'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            <CategoryIcon category={job.sourceCategory} />
            <span>.{job.sourceExt}</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-fg truncate" title={job.file.name}>
              {job.file.name}
            </div>
            <div className="flex items-center gap-2 text-xs text-fg-muted mt-0.5 font-medium min-w-0">
              <span className="shrink-0">{formatBytes(job.file.size)}</span>
              {job.status === 'done' && job.resultSize !== undefined && (
                <>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    {formatBytes(job.resultSize)}
                  </span>
                </>
              )}
              {isConverting && (
                <span className="truncate text-accent">· {job.statusMessage || 'Memproses...'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Target format + settings */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs font-semibold text-fg-muted">ke</span>
          <button
            type="button"
            onClick={onPickFormat}
            disabled={isConverting}
            aria-label={`Format tujuan ${job.targetExt.toUpperCase()}, ganti format`}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-extrabold uppercase smooth-theme disabled:opacity-60 ${
              dstInfo?.badgeColor ||
              'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/30'
            }`}
          >
            <span>.{job.targetExt}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            disabled={isConverting}
            title="Pengaturan lanjutan (kualitas, DPI, mode PDF ke Word, resize)"
            aria-label="Pengaturan lanjutan"
            className="p-2 rounded-xl smooth-theme bg-surface border border-line text-fg-muted hover:text-accent hover:border-indigo-400 disabled:opacity-60"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Status actions */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {job.status === 'idle' && (
            <button
              type="button"
              onClick={onRun}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-300 hover:bg-indigo-600 hover:text-white dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/30 dark:hover:bg-indigo-600 dark:hover:text-white smooth-theme"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Konversi</span>
            </button>
          )}

          {isConverting && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold text-accent">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {job.progress}%
            </span>
          )}

          {job.status === 'done' && (
            <>
              <CheckCircle2
                className="hidden sm:block w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-1"
                aria-label="Selesai"
              />
              <button
                type="button"
                onClick={onPreview}
                title="Lihat pratinjau hasil"
                aria-label="Lihat pratinjau hasil"
                className="p-2 rounded-xl smooth-theme bg-surface border border-line text-fg-soft hover:bg-sunken"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 smooth-theme"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </button>
            </>
          )}

          {job.status === 'error' && (
            <button
              type="button"
              onClick={onRun}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/30 smooth-theme"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ulangi</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRemove}
            disabled={isConverting}
            title="Hapus dari daftar"
            aria-label="Hapus dari daftar"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-900 smooth-theme disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {job.status === 'error' && (
        <div
          role="alert"
          className="flex items-start gap-2 px-3 sm:px-5 pb-3.5 -mt-1 text-xs font-medium text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span className="break-words">{job.errorMessage || 'Gagal mengonversi file.'}</span>
        </div>
      )}

      {isConverting && (
        <div
          className="absolute inset-x-0 bottom-0 h-1 bg-purple-200/60 dark:bg-slate-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={job.progress}
          aria-label={`Progres konversi ${job.file.name}`}
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      )}
    </li>
  );
};
