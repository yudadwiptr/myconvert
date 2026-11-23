import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { formatBytes } from '../../utils/formatBytes';
import { ConversionQueue } from '../../hooks/useConversionQueue';
import { FormatPickerPopover } from '../FormatPickerPopover';
import { JobSettingsModal } from '../JobSettingsModal';
import { PreviewModal } from '../PreviewModal';
import { Dropzone } from './Dropzone';
import { JobCard } from './JobCard';

const ALL_JOBS = '__all__';

const TOOLBAR_BTN =
  'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-bold smooth-theme disabled:opacity-50 disabled:pointer-events-none';

interface ConverterPanelProps {
  queue: ConversionQueue;
  /** Target format to prefer for newly added files (from the active tool preset). */
  preferredTargetExt?: string;
}

export const ConverterPanel: React.FC<ConverterPanelProps> = ({ queue, preferredTargetExt }) => {
  const { jobs, completedCount, pendingCount, convertingCount, commonTargetFormats, allSameTarget } = queue;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerJobId, setPickerJobId] = useState<string | null>(null);
  const [settingsJobId, setSettingsJobId] = useState<string | null>(null);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);

  const errorCount = jobs.filter((j) => j.status === 'error').length;
  const totalBytes = jobs.reduce((sum, j) => sum + j.file.size, 0);

  const pickerJob = useMemo(() => jobs.find((j) => j.id === pickerJobId) || null, [jobs, pickerJobId]);
  const settingsJob = useMemo(() => jobs.find((j) => j.id === settingsJobId) || null, [jobs, settingsJobId]);
  const previewJob = useMemo(() => jobs.find((j) => j.id === previewJobId) || null, [jobs, previewJobId]);

  const addFiles = (files: FileList | File[], forcedTargetExt?: string) =>
    queue.addFiles(files, forcedTargetExt || preferredTargetExt);
  const browse = () => fileInputRef.current?.click();

  return (
    <>
      <div className="rounded-3xl smooth-theme border border-line/90 bg-surface/80 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(139,92,246,0.14)] dark:shadow-2xl dark:shadow-indigo-950/30 overflow-hidden">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />

        <Dropzone onFiles={addFiles} onBrowse={browse} />

        {jobs.length > 0 && (
          <div className="p-3 sm:p-6 space-y-4">
            {/* Batch toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-soft">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-fg">Antrean File</h2>
                  {completedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {completedCount} selesai
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                      <AlertCircle className="w-3 h-3" />
                      {errorCount} gagal
                    </span>
                  )}
                </div>
                <p className="text-xs text-fg-muted font-medium mt-0.5">
                  {jobs.length} file · {formatBytes(totalBytes)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {jobs.length > 1 && commonTargetFormats.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPickerJobId(ALL_JOBS)}
                    disabled={convertingCount > 0}
                    className={`${TOOLBAR_BTN} bg-surface border-line text-fg-soft hover:border-indigo-400 hover:text-fg`}
                  >
                    <span>Ubah semua ke</span>
                    <span className="font-mono font-extrabold text-accent uppercase">
                      {allSameTarget ? `.${jobs[0].targetExt}` : '…'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={browse}
                  className={`${TOOLBAR_BTN} bg-surface border-line text-fg-soft hover:border-indigo-400 hover:text-fg`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah File</span>
                </button>

                <button
                  type="button"
                  onClick={queue.clearAll}
                  disabled={convertingCount > 0}
                  className={`${TOOLBAR_BTN} border-transparent text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              </div>
            </div>

            <ul className="space-y-2.5">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPickFormat={() => setPickerJobId(job.id)}
                  onOpenSettings={() => setSettingsJobId(job.id)}
                  onRun={() => queue.runJob(job)}
                  onPreview={() => setPreviewJobId(job.id)}
                  onDownload={() => queue.downloadJob(job)}
                  onRemove={() => queue.removeJob(job.id)}
                />
              ))}
            </ul>

            {/* Bottom action bar */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft">
              <div className="text-xs font-medium text-fg-muted flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Diproses 100% lokal di perangkat Anda • Tanpa batas ukuran file</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {completedCount > 1 && (
                  <button
                    type="button"
                    onClick={queue.downloadAllZip}
                    disabled={queue.isZippingAll}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 smooth-theme"
                  >
                    {queue.isZippingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                    <span>Download Semua ({completedCount} File .ZIP)</span>
                  </button>
                )}

                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={queue.runAll}
                    disabled={convertingCount > 0}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white shadow-xl shadow-indigo-600/25 smooth-theme"
                  >
                    {convertingCount > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengonversi...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Konversi {pendingCount > 1 ? `Semua (${pendingCount} File)` : 'Sekarang'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Popovers & modals (outside the blurred panel so `fixed` covers the viewport) */}
      {pickerJobId === ALL_JOBS && (
        <FormatPickerPopover
          sourceExt={jobs[0]?.sourceExt ?? ''}
          currentTargetExt={allSameTarget ? jobs[0].targetExt : ''}
          availableOverride={commonTargetFormats}
          searchPlaceholder={`Cari format untuk ${jobs.length} file...`}
          onSelect={queue.setAllTargets}
          onClose={() => setPickerJobId(null)}
        />
      )}

      {pickerJob && (
        <FormatPickerPopover
          sourceExt={pickerJob.sourceExt}
          currentTargetExt={pickerJob.targetExt}
          onSelect={(ext) => queue.setJobTarget(pickerJob.id, ext)}
          onClose={() => setPickerJobId(null)}
        />
      )}

      {settingsJob && (
        <JobSettingsModal job={settingsJob} onSave={queue.updateSettings} onClose={() => setSettingsJobId(null)} />
      )}

      {previewJob && (
        <PreviewModal job={previewJob} onDownload={queue.downloadJob} onClose={() => setPreviewJobId(null)} />
      )}
    </>
  );
};
